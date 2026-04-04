importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js");
importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js");

// WASM dosyalarının nerede olduğunu belirt
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";

const HF_BASE = "https://huggingface.co/rumixist/Ogdul-eg-s1-20M/resolve/main";

let session   = null;
let tokenToId = null;
let idToToken = null;
let mergeRank = null;
let eosId     = -1;
let astId     = -1;

async function fetchWithProgress(url, label) {
  postMessage({ type: "status", text: label });
  const res = await fetch(url);
  if (!res.ok) throw new Error("İndirme hatası: " + res.status);
  const total  = parseInt(res.headers.get("content-length") || "0");
  const reader = res.body.getReader();
  const chunks = []; let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); received += value.length;
    if (total) {
      postMessage({ type: "progress", pct: Math.round(received / total * 100) });
    }
  }
  const all = new Uint8Array(received); let pos = 0;
  for (const c of chunks) { all.set(c, pos); pos += c.length; }
  return all.buffer;
}

async function loadTokenizer() {
  postMessage({ type: "status", text: "Tokenizer yükleniyor..." });
  const res  = await fetch(HF_BASE + "/tokenizer.json");
  const data = await res.json();
  tokenToId  = data.model.vocab;
  idToToken  = Object.fromEntries(Object.entries(tokenToId).map(([k, v]) => [v, k]));
  mergeRank  = {};
  data.model.merges.forEach((m, i) => {
    const key = Array.isArray(m) ? m[0] + " " + m[1] : m;
    mergeRank[key] = i;
  });
  eosId = tokenToId["<|endoftext|>"] ?? -1;
  astId = tokenToId["<|assistant|>"] ?? -1;
}

async function loadModel() {
  let buffer;
  try {
    const cache = await caches.open("ogdul-v1");
    const hit   = await cache.match("ogdul.onnx");
    if (hit) {
      postMessage({ type: "status", text: "Model önbellekten yükleniyor..." });
      buffer = await hit.arrayBuffer();
    } else {
      buffer = await fetchWithProgress(HF_BASE + "/ogdul.onnx", "Model indiriliyor (ilk açılış ~195MB)...");
      cache.put("ogdul.onnx", new Response(buffer.slice(0)));
    }
  } catch {
    buffer = await fetchWithProgress(HF_BASE + "/ogdul.onnx", "Model indiriliyor...");
  }
  postMessage({ type: "status", text: "Model başlatılıyor..." });
  ort.env.wasm.numThreads = 1;
  session = await ort.InferenceSession.create(buffer, { executionProviders: ["wasm"] });
}

// Python tokenizer ile birebir aynı davranış:
// Sadece en başa ▁ ekle, sonrası karakter karakter BPE
function bpeEncode(text) {
  const unk = tokenToId["<unk>"] ?? 0;
  const chars = ["▁", ...[...text]];

  let tokens = chars;
  while (true) {
    let bestRank = Infinity, bestIdx = -1;
    for (let i = 0; i < tokens.length - 1; i++) {
      const r = mergeRank[tokens[i] + " " + tokens[i + 1]];
      if (r !== undefined && r < bestRank) { bestRank = r; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    tokens.splice(bestIdx, 2, tokens[bestIdx] + tokens[bestIdx + 1]);
  }

  return tokens.map(t => tokenToId[t] ?? unk);
}

function decodeIds(ids) {
  let text = "";
  for (const id of ids) {
    const tok = idToToken[id] ?? "";
    if (tok === "[UNK]") continue; // UNK'ları atla
    text += tok.startsWith("▁") ? " " + tok.slice(1) : tok;
  }
  return text
    .replace(/<0x([0-9A-Fa-f]{2})>/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();
}

function softmax(arr) {
  const max  = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - max));
  const sum  = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

function applyRepetitionPenalty(logits, generatedIds, penalty) {
  for (const id of new Set(generatedIds)) {
    if (logits[id] > 0) logits[id] /= penalty;
    else                 logits[id] *= penalty;
  }
  return logits;
}

function applyTopK(logits, k) {
  const sorted    = [...logits].sort((a, b) => b - a);
  const threshold = sorted[Math.min(k, sorted.length) - 1];
  return logits.map(v => v >= threshold ? v : -Infinity);
}

function applyTopP(logits, p) {
  const indexed = logits.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const probs   = softmax(indexed.map(x => x[0]));
  let cum = 0;
  const keep = new Set();
  for (let i = 0; i < probs.length; i++) {
    keep.add(indexed[i][1]);
    cum += probs[i];
    if (cum >= p) break;
  }
  return logits.map((v, i) => keep.has(i) ? v : -Infinity);
}

function sampleFromLogits(logits, generatedIds, temperature, topK, topP) {
  let l = Array.from(logits);
  l = applyRepetitionPenalty(l, generatedIds, 1.2);
  l = l.map(v => v / temperature);
  l = applyTopK(l, topK);
  l = applyTopP(l, topP);
  const probs = softmax(l);
  let r = Math.random(), cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (r < cum) return i;
  }
  return probs.indexOf(Math.max(...probs));
}

async function generate({ userText, temperature, topK, topP, maxNew }) {
  const prompt   = "<|user|>\n" + userText + "\n<|assistant|>\n";
  const inputIds = bpeEncode(prompt);
  const generated = [];
  let context = [...inputIds];
  let streamBuffer = []; // Henüz ekrana yazmadığımız tokenlar

  // Gerçek EOS sequence
  const EOS_SEQ = [33, 0, 2153, 2590, 1272, 18353, 0, 35];

  function endsWithEos(arr) {
    if (arr.length < EOS_SEQ.length) return false;
    return EOS_SEQ.every((v, i) => v === arr[arr.length - EOS_SEQ.length + i]);
  }

  for (let i = 0; i < maxNew; i++) {
    const ctx    = context.length > 512 ? context.slice(-512) : context;
    const tensor = new ort.Tensor("int64",
      BigInt64Array.from(ctx.map(BigInt)), [1, ctx.length]);

    const out        = await session.run({ tokens: tensor });
    const logits     = out.logits.data;
    const vocabSize  = out.logits.dims[2];
    const lastLogits = Array.from(
      logits.slice((ctx.length - 1) * vocabSize, ctx.length * vocabSize)
    );

    const nextId = sampleFromLogits(lastLogits, generated, temperature, topK, topP);
    generated.push(nextId);
    context.push(nextId);
    streamBuffer.push(nextId);

    if (endsWithEos(generated)) {
      // EOS tokenlarını çıkar
      generated.splice(-EOS_SEQ.length);
      break;
    }

    // Stream buffer'dan güvenli kısmı yaz (EOS başlayabilir diye son 8 tokeni tut)
    const safeCount = Math.max(0, streamBuffer.length - EOS_SEQ.length);
    for (let j = 0; j < safeCount; j++) {
      const tok = idToToken[streamBuffer[j]] ?? "";
      // [UNK] tokenlarını atla
      if (tok === "[UNK]" || tok === "") continue;
      const text = tok.startsWith("▁") ? " " + tok.slice(1) : tok;
      postMessage({ type: "token", text });
    }
    streamBuffer = streamBuffer.slice(safeCount);
  }

  // Kalan buffer'ı yaz (EOS yoksa)
  for (const id of streamBuffer) {
    const tok = idToToken[id] ?? "";
    if (tok === "[UNK]" || tok === "") continue;
    const text = tok.startsWith("▁") ? " " + tok.slice(1) : tok;
    postMessage({ type: "token", text });
  }

  let response = decodeIds(generated)
    .replace(/\[UNK\]/g, "")
    .replace(/<\|assistant\|>/g, "")
    .replace(/<\|endoftext\|>/g, "")
    .replace(/<\|user\|>/g, "")
    .trim();

  postMessage({ type: "done", text: response });
}

onmessage = async (e) => {
  const { cmd } = e.data;
  try {
    if (cmd === "init") {
      await loadTokenizer();
      await loadModel();
      postMessage({ type: "ready" });
    } else if (cmd === "generate") {
      await generate(e.data);
    }
  } catch (err) {
    postMessage({ type: "error", text: err.message });
  }
};
