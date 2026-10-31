const assert = require("node:assert/strict");
const { test, afterEach } = require("node:test");

Object.defineProperty(globalThis, "__DEV__", {
  value: true,
  configurable: true,
});
const {
  requestPrediction,
  audioFailure,
  requestFailure,
} = require("./client.ts");
const { mockPredict, mockScenarios } = require("./screening.mock.ts");
const { ScreeningSession } = require("./screening-session.ts");
const { audioFormat, validChildId } = require("./audio-format.ts");
const { appendAudio } = require("./audio-file.web.ts");
const {
  isPredictSuccessResponse,
  toSaveScreeningPayload,
} = require("../../types/screening.ts");
const {
  originHrefForSource,
  parseScreeningSource,
  withScreeningSource,
} = require("./screening-source.ts");
const { createSingleFlightGate } = require("./single-flight.ts");
const fs = require("node:fs");
const path = require("node:path");
const appConfig = require("../../../app.json");
const easConfig = require("../../../eas.json");
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("mock covers both outcomes, disagreement and every audio/network failure", async () => {
  for (const scenario of mockScenarios) {
    if (["normal", "risk", "disagreement"].includes(scenario)) {
      const result = await mockPredict({ scenario, delayMs: 0 });
      assert.equal(isPredictSuccessResponse(result), true);
      assert.equal(result.agreement, scenario !== "disagreement");
    } else {
      await assert.rejects(mockPredict({ scenario, delayMs: 0 }), (error) => {
        assert.equal(
          error.detail.kind,
          ["offline", "timeout", "server"].includes(scenario)
            ? scenario
            : "audio_validation",
        );
        assert.equal(
          error.detail.canRetrySameFile,
          ["offline", "timeout", "server"].includes(scenario),
        );
        return true;
      });
    }
  }
});

test("mock abort cancels the pending delay", async () => {
  const controller = new AbortController();
  const request = mockPredict({ signal: controller.signal, delayMs: 2000 });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
});

test("multipart request leaves the content-type boundary to fetch", async () => {
  const body = new FormData();
  let stages = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost/predict");
    assert.equal(options.body, body);
    assert.equal(options.method, "POST");
    assert.equal(options.headers, undefined);
    return Response.json({ status: "success" });
  };
  assert.deepEqual(
    await requestPrediction("http://localhost/predict", body, {
      onResponse: () => stages++,
    }),
    { status: "success" },
  );
  assert.equal(stages, 1);
});

test("HTTP 422 maps only recognized codes; invalid JSON and 500 remain server errors", async () => {
  for (const code of mockScenarios.filter(
    (scenario) => scenario === scenario.toUpperCase(),
  )) {
    globalThis.fetch = async () =>
      Response.json({ status: "error", code }, { status: 422 });
    await assert.rejects(
      requestPrediction("http://localhost/predict", new FormData()),
      (error) => error.detail.code === code && !error.detail.canRetrySameFile,
    );
  }
  for (const response of [
    Response.json({ status: "error", code: "OTHER" }, { status: 422 }),
    new Response("not JSON"),
    Response.json({}, { status: 500 }),
  ]) {
    globalThis.fetch = async () => response;
    await assert.rejects(
      requestPrediction("http://localhost/predict", new FormData()),
      (error) =>
        error.detail.kind === "server" && error.detail.canRetrySameFile,
    );
  }
});

test("network errors, timeout and user cancellation stay distinct", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("network");
  };
  await assert.rejects(
    requestPrediction("http://localhost/predict", new FormData()),
    (error) => error.detail.kind === "offline",
  );
  globalThis.fetch = async (_, { signal }) =>
    new Promise((resolve, reject) =>
      signal.addEventListener("abort", () =>
        reject(new DOMException("Aborted", "AbortError")),
      ),
    );
  await assert.rejects(
    requestPrediction("http://localhost/predict", new FormData(), {
      timeoutMs: 5,
    }),
    (error) => error.detail.kind === "timeout",
  );
  const controller = new AbortController();
  const pending = requestPrediction(
    "http://localhost/predict",
    new FormData(),
    { signal: controller.signal },
  );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("formats preserve m4a/wav/aac MIME and dummy child IDs never pass", () => {
  assert.deepEqual(audioFormat("file:///cache/cough.M4A?x=1"), {
    extension: "m4a",
    mimeType: "audio/mp4",
  });
  assert.equal(audioFormat("file:///cache/cough.wav").mimeType, "audio/wav");
  assert.equal(audioFormat("file:///cache/cough.aac").mimeType, "audio/aac");
  assert.equal(
    audioFormat("blob:local", "audio/webm;codecs=opus").extension,
    "webm",
  );
  assert.equal(audioFormat("file:///cache/cough.mp3"), null);
  for (const id of [undefined, "demo-child", "", "example", "not-a-uuid"])
    assert.equal(validChildId(id), false);
  assert.equal(validChildId("00000000-0000-4000-8000-000000000001"), true);
});

test("web multipart uses the recorded MIME type and enforces the 10 MiB limit", async () => {
  globalThis.fetch = async () =>
    new Response(new Blob(["recording"], { type: "audio/webm" }));
  const body = new FormData();
  await appendAudio(body, "blob:recording");
  assert.equal(body.get("audio").name, "cough.webm");
  assert.equal(body.get("audio").type, "audio/webm");
  globalThis.fetch = async () =>
    new Response(
      new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "audio/webm" }),
    );
  await assert.rejects(
    appendAudio(new FormData(), "blob:large"),
    (error) => error.detail.code === "FILE_TOO_LARGE",
  );
  globalThis.fetch = async () =>
    new Response(new Blob([], { type: "audio/webm" }));
  await assert.rejects(
    appendAudio(new FormData(), "blob:empty"),
    (error) => error.detail.code === "AUDIO_SILENT",
  );
});

test("success cleans audio before exposing the result and blocks duplicate submissions", async () => {
  const result = await mockPredict({ delayMs: 0 });
  const removed = [];
  let resolve;
  const session = new ScreeningSession({
    predict: () =>
      new Promise((done) => {
        resolve = done;
      }),
    cleanup: async (uri) => {
      removed.push(uri);
    },
  });
  const input = { audioUri: "file:///test.m4a", simulation: false };
  assert.equal(session.start(input), true);
  assert.equal(session.start(input), false);
  assert.equal(session.getSnapshot().status, "uploading");
  resolve(result);
  await tick();
  assert.equal(session.getSnapshot().status, "success");
  assert.equal(session.getSnapshot().pendingAudioUri, null);
  assert.equal(session.getSnapshot().lastResult, result);
  assert.deepEqual(removed, [input.audioUri]);
});

test("bad audio is deleted and never becomes a result", async () => {
  const removed = [];
  const session = new ScreeningSession({
    predict: async () => {
      throw audioFailure("NO_COUGH_DETECTED");
    },
    cleanup: async (uri) => removed.push(uri),
  });
  session.start({ audioUri: "file:///bad.m4a", simulation: false });
  await tick();
  assert.equal(session.getSnapshot().status, "error");
  assert.equal(session.getSnapshot().lastResult, null);
  assert.equal(session.getSnapshot().pendingAudioUri, null);
  assert.equal(session.retry(), false);
  assert.deepEqual(removed, ["file:///bad.m4a"]);
});

test("offline retains the same recording for retry and cleans it after recovery", async () => {
  const result = await mockPredict({ delayMs: 0 });
  const seen = [],
    removed = [];
  const session = new ScreeningSession({
    predict: async (input) => {
      seen.push(input.audioUri);
      if (seen.length === 1) throw requestFailure("offline");
      return result;
    },
    cleanup: async (uri) => removed.push(uri),
  });
  session.start({ audioUri: "file:///retry.m4a", simulation: false });
  await tick();
  assert.equal(session.getSnapshot().pendingAudioUri, "file:///retry.m4a");
  assert.equal(removed.length, 0);
  assert.equal(session.retry(), true);
  await tick();
  assert.deepEqual(seen, ["file:///retry.m4a", "file:///retry.m4a"]);
  assert.deepEqual(removed, ["file:///retry.m4a"]);
  assert.equal(session.getSnapshot().status, "success");
});

test("cancel aborts, deletes audio and ignores a stale response", async () => {
  const result = await mockPredict({ delayMs: 0 });
  let resolve, signal;
  const removed = [];
  const session = new ScreeningSession({
    predict: (_, s) => {
      signal = s;
      return new Promise((done) => {
        resolve = done;
      });
    },
    cleanup: async (uri) => removed.push(uri),
  });
  session.start({ audioUri: "file:///cancel.m4a", simulation: false });
  await session.clear();
  assert.equal(signal.aborted, true);
  assert.deepEqual(removed, ["file:///cancel.m4a"]);
  resolve(result);
  await tick();
  assert.equal(session.getSnapshot().status, "idle");
  assert.equal(session.getSnapshot().lastResult, null);
});

test("failed deletion cannot silently publish a successful result", async () => {
  const result = await mockPredict({ delayMs: 0 });
  const session = new ScreeningSession({
    predict: async () => result,
    cleanup: async () => {
      throw new Error("unavailable");
    },
  });
  session.start({ audioUri: "file:///locked.m4a", simulation: false });
  await tick();
  assert.equal(session.getSnapshot().status, "error");
  assert.equal(session.getSnapshot().pendingAudioUri, "file:///locked.m4a");
  assert.equal(session.getSnapshot().lastResult, null);
});

test("a cancelled response cannot overwrite a newer analysis", async () => {
  const normal = await mockPredict({ scenario: "normal", delayMs: 0 });
  const risk = await mockPredict({ scenario: "risk", delayMs: 0 });
  let firstResolve;
  let attempts = 0;
  const session = new ScreeningSession({
    predict: async () =>
      ++attempts === 1
        ? new Promise((resolve) => {
            firstResolve = resolve;
          })
        : risk,
    cleanup: async () => {},
  });
  session.start({ audioUri: "file:///old.m4a", simulation: false });
  await session.clear();
  session.start({ audioUri: "file:///new.m4a", simulation: false });
  await tick();
  firstResolve(normal);
  await tick();
  assert.equal(session.getSnapshot().lastResult, risk);
});

test("toSaveScreeningPayload maps screenings schema without audio fields", async () => {
  const result = await mockPredict({ scenario: "risk", delayMs: 0 });
  const childId = "00000000-0000-4000-8000-000000000001";
  const payload = toSaveScreeningPayload(childId, result);
  assert.deepEqual(Object.keys(payload).sort(), [
    "ae_error",
    "ae_threshold",
    "agreement",
    "child_id",
    "chunks",
    "duration_sec",
    "model_version",
    "ocsvm_score",
    "result",
    "summary",
    "waveform",
  ]);
  assert.equal(payload.child_id, childId);
  assert.equal(payload.result, "risk");
  assert.equal(payload.ae_error, result.autoencoder.error);
  assert.equal(payload.ae_threshold, result.autoencoder.threshold);
  assert.equal(payload.ocsvm_score, result.ocsvm.score);
  assert.notEqual(payload.waveform, result.waveform);
});

test("non-blocking save publishes result immediately, handles failure and supports retrySave", async () => {
  const risk = await mockPredict({ scenario: "risk", delayMs: 0 });
  const childId = "00000000-0000-4000-8000-000000000001";
  const savedPayloads = [];
  let riskNotified = 0;
  let saveAttempts = 0;
  let resolveSecondSave;
  const session = new ScreeningSession({
    predict: async () => risk,
    cleanup: async () => {},
    onRiskResult: () => {
      riskNotified += 1;
    },
    save: async (payload) => {
      saveAttempts += 1;
      savedPayloads.push(payload);
      if (saveAttempts === 1) {
        throw new Error("supabase save failed");
      }
      return new Promise((resolve) => {
        resolveSecondSave = resolve;
      });
    },
  });
  session.start({
    audioUri: "file:///save-test.m4a",
    childId,
    simulation: false,
  });
  await tick();
  assert.equal(session.getSnapshot().status, "success");
  assert.equal(session.getSnapshot().lastResult, risk);
  assert.equal(typeof session.getSnapshot().completedAt, "string");
  assert.equal(session.getSnapshot().saveStatus, "save_failed");
  assert.equal(riskNotified, 1);
  assert.equal(session.retrySave(), true);
  assert.equal(session.getSnapshot().saveStatus, "saving");
  assert.equal(session.retrySave(), false);
  resolveSecondSave();
  await tick();
  assert.equal(session.getSnapshot().saveStatus, "saved");
  assert.equal(savedPayloads.length, 2);
  assert.deepEqual(savedPayloads[0], savedPayloads[1]);
});

test("preview childId skips history save and normal outcome does not fire risk haptic callback", async () => {
  const normal = await mockPredict({ scenario: "normal", delayMs: 0 });
  let saveCalled = false;
  let riskNotified = 0;
  const session = new ScreeningSession({
    predict: async () => normal,
    cleanup: async () => {},
    onRiskResult: () => {
      riskNotified += 1;
    },
    save: async () => {
      saveCalled = true;
    },
  });
  session.start({
    audioUri: "file:///preview.m4a",
    childId: "demo-child",
    simulation: false,
  });
  await tick();
  assert.equal(session.getSnapshot().status, "success");
  assert.equal(session.getSnapshot().saveStatus, "idle");
  assert.equal(saveCalled, false);
  assert.equal(riskNotified, 0);
});

test("pre-upload connectivity check fails fast when offline and preserves audio for retry", async () => {
  const normal = await mockPredict({ scenario: "normal", delayMs: 0 });
  let online = false;
  let predictCalls = 0;
  const removed = [];
  const session = new ScreeningSession({
    isOnline: async () => online,
    predict: async () => {
      predictCalls += 1;
      return normal;
    },
    cleanup: async (uri) => removed.push(uri),
  });
  session.start({
    audioUri: "file:///offline-fast.m4a",
    simulation: false,
  });
  await tick();
  assert.equal(predictCalls, 0);
  assert.equal(session.getSnapshot().status, "error");
  assert.equal(session.getSnapshot().error?.kind, "offline");
  assert.equal(
    session.getSnapshot().pendingAudioUri,
    "file:///offline-fast.m4a",
  );
  assert.equal(removed.length, 0);
  online = true;
  assert.equal(session.retry(), true);
  await tick();
  assert.equal(predictCalls, 1);
  assert.equal(session.getSnapshot().status, "success");
  assert.deepEqual(removed, ["file:///offline-fast.m4a"]);
});

test("monitoring entry-point helpers normalize source param and preserve return route", () => {
  assert.equal(parseScreeningSource("monitoring"), "monitoring");
  assert.equal(parseScreeningSource(["monitoring", "other"]), "monitoring");
  assert.equal(parseScreeningSource("home"), undefined);
  assert.equal(parseScreeningSource(undefined), undefined);

  assert.deepEqual(withScreeningSource("/screening/record", "monitoring"), {
    pathname: "/screening/record",
    params: { source: "monitoring" },
  });
  assert.equal(withScreeningSource("/screening/record"), "/screening/record");
  assert.equal(originHrefForSource("monitoring"), "/(tabs)/monitoring");
  assert.equal(originHrefForSource(undefined), "/(tabs)");
});

test("eas.json and app.json define valid Android package, minimal permissions and APK preview profile", () => {
  assert.equal(appConfig.expo.android.package, "com.pneumotrack.app");
  assert.equal(appConfig.expo.ios.bundleIdentifier, "com.pneumotrack.app");
  assert.deepEqual(appConfig.expo.android.permissions, [
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
    "android.permission.ACCESS_NETWORK_STATE",
  ]);
  for (const blocked of [
    "android.permission.CAMERA",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ]) {
    assert.equal(
      appConfig.expo.android.blockedPermissions.includes(blocked),
      true,
    );
  }
  assert.equal(easConfig.build.development.developmentClient, true);
  assert.equal(easConfig.build.development.distribution, "internal");
  assert.equal(easConfig.build.development.android.buildType, "apk");
  assert.equal(easConfig.build.preview.distribution, "internal");
  assert.equal(easConfig.build.preview.android.buildType, "apk");
  assert.equal(easConfig.build.production.android.buildType, "app-bundle");
});

test("single-flight gate blocks rapid double-taps on navigation and async actions", async () => {
  const gate = createSingleFlightGate();
  let pushes = 0;

  const firstTap = gate.navigate(() => {
    pushes += 1;
  });
  const secondTap = gate.navigate(() => {
    pushes += 1;
  });
  assert.deepEqual(await Promise.all([firstTap, secondTap]), [true, false]);
  assert.equal(pushes, 1);
  assert.equal(gate.isLocked(), true);
  assert.equal(await gate.navigate(() => ++pushes), false);
  assert.equal(pushes, 1);

  gate.reset();
  assert.equal(gate.isLocked(), false);

  const abortedNavigation = await gate.navigate(async () => false);
  assert.equal(abortedNavigation, false);
  assert.equal(gate.isLocked(), false);

  let releaseRun;
  let runs = 0;
  const run1 = gate.run(
    () =>
      new Promise((resolve) => {
        runs += 1;
        releaseRun = resolve;
      }),
  );
  const run2 = gate.run(() => {
    runs += 1;
  });
  assert.equal(await run2, false);
  assert.equal(runs, 1);
  releaseRun();
  assert.equal(await run1, true);
  assert.equal(gate.isLocked(), false);
});

test("concurrent clearSession calls only delete audio and resolve true once", async () => {
  let releaseCleanup;
  const cleaned = [];
  const session = new ScreeningSession({
    predict: () => new Promise(() => {}),
    cleanup: (uri) =>
      new Promise((resolve) => {
        cleaned.push(uri);
        releaseCleanup = resolve;
      }),
  });
  session.start({ audioUri: "file:///double-clear.m4a", simulation: false });
  const firstClear = session.clear();
  const secondClear = session.clear();
  assert.equal(await secondClear, false);
  releaseCleanup();
  assert.equal(await firstClear, true);
  assert.deepEqual(cleaned, ["file:///double-clear.m4a"]);
});

test("src passes medical safety, privacy, large-font flex-wrap and accessibility audit", () => {
  const srcRoot = path.resolve(process.cwd(), "src");
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(walk(fullPath));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }
  const sourceFiles = walk(srcRoot);
  assert.equal(sourceFiles.length > 0, true);

  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, "utf8");
    assert.equal(
      /\bconsole\.(log|debug|info)\b/.test(text),
      false,
      `Forbidden console logging in ${file}`,
    );
    assert.equal(
      /96[.,]3/.test(text),
      false,
      `Forbidden 96.3% claim in ${file}`,
    );
    assert.equal(
      /menderita pneumonia|positif pneumonia|has pneumonia|terdiagnosis pneumonia|bebas pneumonia/i.test(
        text,
      ),
      false,
      `Forbidden diagnostic phrase in ${file}`,
    );
    assert.equal(
      /service_role/i.test(text),
      false,
      `Forbidden service_role secret reference in ${file}`,
    );
  }

  for (const rel of [
    "components/ui/status-banner.tsx",
    "components/ui/button.tsx",
    "components/ui/screen-header.tsx",
    "components/ui/danger-signs-box.tsx",
  ]) {
    const content = fs.readFileSync(path.join(srcRoot, rel), "utf8");
    assert.equal(
      content.includes("flex-wrap"),
      true,
      `Expected flex-wrap for large font scaling in ${rel}`,
    );
  }
});
