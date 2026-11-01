const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");
const path = require("node:path");
const { mock, test } = require("bun:test");

Object.defineProperty(globalThis, "__DEV__", { value: false, configurable: true });

class FixtureFile {
  constructor(uri) {
    this.uri = uri;
    this.name = uri.split("/").pop();
    this.exists = !uri.includes("missing");
    this.size = uri.includes("empty") ? 0 : uri.includes("large") ? 11 * 1024 * 1024 : 3;
    this.type = "audio/mp4";
  }
  async bytes() {
    return Uint8Array.from([7, 8, 9]);
  }
}

mock.module("expo-file-system", () => ({ File: FixtureFile }));
const { appendAudio } = require("./audio-file.ts");
const expoRoot = path.dirname(require.resolve("expo/package.json"));
const { installFormDataPatch } = require(path.join(expoRoot, "src/winter/FormData.ts"));
const { convertFormDataAsync } = require(path.join(expoRoot, "src/winter/fetch/convertFormData.ts"));

class NativeFormData {
  _parts = [];
}
installFormDataPatch(NativeFormData);

test("native audio is serialized into bytes by the installed Expo multipart encoder", async () => {
  const body = new NativeFormData();
  await appendAudio(body, "file:///cache/recording.m4a");
  const encoded = await convertFormDataAsync(body, "regression-boundary");
  const text = new TextDecoder().decode(encoded.body);
  assert.match(text, /name="audio"; filename="recording.m4a"/);
  assert.match(text, /content-type: audio\/mp4/);
  assert.equal(text.includes("file:///"), false);
  assert.notEqual(Buffer.from(encoded.body).indexOf(Buffer.from([7, 8, 9])), -1);
});

test("the former URI descriptor fails with the installed SDK 58 encoder", async () => {
  const body = new NativeFormData();
  body.append("audio", { uri: "file:///cache/recording.m4a", name: "cough.m4a", type: "audio/mp4" });
  await assert.rejects(convertFormDataAsync(body), /Unsupported FormDataPart implementation/);
});

test("native validation rejects unusable files before multipart serialization", async () => {
  for (const [name, code] of [
    ["missing.m4a", "AUDIO_SILENT"],
    ["empty.m4a", "AUDIO_SILENT"],
    ["large.m4a", "FILE_TOO_LARGE"],
    ["recording.txt", "UNSUPPORTED_FORMAT"],
  ]) {
    await assert.rejects(appendAudio(new NativeFormData(), `file:///cache/${name}`), (error) => error.detail.code === code);
  }
});

test("cancelled native uploads do not append audio", async () => {
  const body = new NativeFormData();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(appendAudio(body, "file:///cache/recording.m4a", controller.signal), { name: "AbortError" });
  assert.equal(body._parts.length, 0);
});
