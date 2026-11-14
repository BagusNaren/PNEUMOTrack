const { loadProjectEnv } = require("@expo/env");
const { Buffer } = require("node:buffer");
const { isPredictSuccessResponse, isPredictErrorResponse } = require("../src/types/screening.ts");

loadProjectEnv(process.cwd(), { mode: "production", silent: true });

function syntheticWav(silent) {
  const rate = 22050;
  const count = rate * 6;
  const bytes = Buffer.alloc(44 + count * 2);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(count * 2, 40);
  let seed = 42;
  for (let index = 0; index < count; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 4294967296 * 2 - 1;
    const time = index / rate;
    const envelope = [1, 2.6, 4.2].reduce((value, start) =>
      time >= start && time < start + 0.35 ? Math.exp(-(time - start) / 0.06) : value, 0);
    const sample = silent ? 0 : noise * (0.002 + envelope * 0.8);
    bytes.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  return bytes;
}

async function main() {
  const endpoint = process.env.EXPO_PUBLIC_API_URL;
  if (!endpoint?.startsWith("https://")) throw new Error("HTTPS API URL is required");
  for (const silent of [true, false]) {
    const form = new FormData();
    form.append("audio", new Blob([syntheticWav(silent)], { type: "audio/wav" }), "synthetic-test.wav");
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/predict`, {
      method: "POST", body: form, signal: AbortSignal.timeout(60000),
    });
    const body = await response.json();
    const valid = response.ok ? isPredictSuccessResponse(body)
      : response.status === 422 && isPredictErrorResponse(body);
    process.stdout.write(`${silent ? "Synthetic silence" : "Synthetic bursts"}: HTTP ${response.status}, contract ${valid ? "PASS" : "FAIL"}\n`);
    if (!valid || (silent && response.ok)) process.exitCode = 1;
  }
}

main().catch(() => {
  process.stderr.write("Synthetic audio check failed: network, timeout, or invalid response.\n");
  process.exitCode = 1;
});
