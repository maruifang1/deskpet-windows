const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const VOICE = "zh-CN-XiaoyiNeural";

let engine = null;
let busy = false;

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getEngine() {
  if (!engine) {
    engine = new MsEdgeTTS();
    await engine.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  }
  return engine;
}

function collectStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("close", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function synthesizeText(text) {
  if (busy) return { skipped: true };
  busy = true;
  try {
    const tts = await getEngine();
    const { audioStream } = await tts.toStream(escapeXml(text));
    const audio = await collectStream(audioStream);
    if (!audio.length) return { skipped: false, failed: true };
    return { skipped: false, audio };
  } catch {
    return { skipped: false, failed: true };
  } finally {
    busy = false;
  }
}

module.exports = { synthesizeText };
