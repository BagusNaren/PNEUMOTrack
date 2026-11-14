const assert = require("node:assert/strict");
const { test, mock } = require("bun:test");

mock.module("@/constants/config", () => ({ Config: { useMockData: true } }));
mock.module("@/services/supabase/client", () => ({ supabase: {} }));
mock.module("../mock-data", () => ({
  MOCK_SCREENINGS: Array.from({ length: 60 }, (_, index) => ({
    id: `fixture-${index}`,
    child_id: index === 59 ? "child-b" : "child-a",
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  })),
}));
const { screeningsService } = require("./index.ts");

test("history sorts before applying its limit and keeps children separate", async () => {
  const rows = await screeningsService.listByChild("child-a", 2);
  assert.deepEqual(rows.map((row) => row.id), ["fixture-58", "fixture-57"]);
  assert.equal((await screeningsService.latest("child-a")).id, rows[0].id);
  assert.equal((await screeningsService.listByChild("child-b")).length, 1);
});

test("save completion notifies focused consumers after the record is readable", async () => {
  let notifications = 0;
  const unsubscribe = screeningsService.subscribe(() => { notifications += 1; });
  const pending = screeningsService.save({
    child_id: "child-new",
    result: "normal",
    agreement: true,
    ae_error: 0.01,
    ae_threshold: 0.02,
    ocsvm_score: 0.2,
    chunks: 2,
    duration_sec: 4,
    waveform: [0, 0.5, 0],
    summary: "Hasil simulasi pengujian.",
    model_version: "test",
  });
  assert.equal(notifications, 0);
  const saved = await pending;
  assert.equal(notifications, 1);
  assert.equal((await screeningsService.latest("child-new")).id, saved.id);
  unsubscribe();
  await screeningsService.save({ child_id: "child-new", result: "risk" });
  assert.equal(notifications, 1);
});
