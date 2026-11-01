const assert = require("node:assert/strict");
const { test, mock } = require("bun:test");

const calls = [];
let response;
const query = new Proxy({}, {
  get(_target, method) {
    if (method === "then") return Promise.resolve(response).then.bind(Promise.resolve(response));
    return (...args) => { calls.push([method, ...args]); return query; };
  },
});
mock.module("@/constants/config", () => ({ Config: { useMockData: false } }));
mock.module("@/services/supabase/client", () => ({ supabase: { from: (table) => { calls.push(["from", table]); return query; } } }));
const { chatService } = require("./index.ts");
const message = { id: "message", conversation_id: "conversation", sender_role: "parent", body: "Pesan uji", created_at: "2026-11-01T00:00:00Z" };

test("sending uses the existing database body column and returns display content", async () => {
  response = { data: message, error: null };
  calls.length = 0;
  const result = await chatService.send("conversation", "parent", "Pesan uji");
  assert.deepEqual(calls.find(([name]) => name === "insert")[1], { conversation_id: "conversation", sender_role: "parent", body: "Pesan uji" });
  assert.equal(result.content, "Pesan uji");
  assert.equal(result.sender_id, "parent");
});

test("message reads map stored body and preserve timestamp without fabricated fallback", async () => {
  response = { data: [message], error: null };
  const [result] = await chatService.getMessages("conversation");
  assert.equal(result.content, message.body);
  assert.equal(result.created_at, message.created_at);
});

test("opening a conversation reuses its unique parent-doctor pair", async () => {
  response = { data: { id: "existing", parent_id: "parent", doctor_id: "doctor" }, error: null };
  calls.length = 0;
  assert.equal((await chatService.getOrCreate("parent", "doctor")).id, "existing");
  assert.deepEqual(calls.find(([name]) => name === "upsert").slice(1), [{ parent_id: "parent", doctor_id: "doctor" }, { onConflict: "parent_id,doctor_id" }]);
});

test("conversation read, message read, and send failures propagate to retry UI", async () => {
  const error = new Error("offline fixture");
  response = { data: null, error };
  for (const operation of [() => chatService.listConversations("parent"), () => chatService.getMessages("conversation"), () => chatService.send("conversation", "parent", "test"), () => chatService.getOrCreate("parent", "doctor")]) {
    await assert.rejects(operation, error);
  }
});
