import "./tracing.js"; // side effects only — must load before any model client

import * as http from "node:http";
import type { ModelMessage } from "ai";
import { config, missingRequiredEnv } from "./config.js";
import { ensureStore, initStore, isStoreReady, loadConversation, saveConversation } from "./store.js";
import { runTurn } from "./agent.js";

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Reads the AI SDK's APICallError body; returns null for anything else. See
// building.md "A guardrail block is the ONE upstream error you relay."
function guardrailBlock(err: unknown): { name: string; reason: string } | null {
  const body = (err as { responseBody?: string })?.responseBody;
  if (!body) return null;
  try {
    const m = JSON.parse(body)?.message;
    if (m?.action !== "GUARDRAIL_INTERVENED") return null;
    return { name: m.interveningGuardrail ?? "guardrail", reason: m.actionReason ?? "refused by policy" };
  } catch {
    return null;
  }
}

async function handleChat(req: http.IncomingMessage, res: http.ServerResponse, userId: string): Promise<void> {
  const raw = await readBody(req);
  let body: { conversationId?: unknown; message?: unknown };
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { error: "expected a JSON body" });
    return;
  }

  if (typeof body.message !== "string" || body.message.trim() === "") {
    sendJson(res, 400, { error: "expected { message: string }" });
    return;
  }
  const conversationId = body.conversationId;
  if (conversationId !== undefined && typeof conversationId !== "string") {
    sendJson(res, 400, { error: "conversationId must be a string when present" });
    return;
  }

  await ensureStore();

  let id: string;
  let history: ModelMessage[];
  if (conversationId) {
    const loaded = await loadConversation(conversationId, userId);
    if (loaded === null) {
      sendJson(res, 404, { error: "conversation not found" });
      return;
    }
    id = conversationId;
    history = loaded;
  } else {
    id = crypto.randomUUID();
    history = [];
  }

  const full: ModelMessage[] = [...history, { role: "user", content: body.message }];

  const result = await runTurn(full);

  await saveConversation(id, userId, [...full, ...result.responseMessages]);

  sendJson(res, 200, { conversationId: id, text: result.text, toolCalls: result.toolCalls });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = req.url ?? "/";
  const path = url.split("?")[0];

  if (req.method === "GET" && path === "/healthz") {
    const missing = missingRequiredEnv();
    const store = isStoreReady() ? "ready" : "initialising";
    if (missing.length > 0 || store !== "ready") {
      sendJson(res, 503, { ok: false, missing, store });
    } else {
      sendJson(res, 200, { ok: true });
    }
    return;
  }

  if (req.method === "POST" && path === "/chat") {
    // Inbound gate — see building.md "Reject callers the gateway did not
    // vouch for" and the issue's identity-gate resolution note: this agent
    // has no thunder-app dependency, so x-user-id is not gateway-verified
    // here — it is the conversation-scoping key ticket-api sends (a fresh
    // ticket UUID per conversation), not an end-user identity we verify.
    const userId = req.headers["x-user-id"];
    if (typeof userId !== "string" || userId === "") {
      res.statusCode = 401;
      res.end();
      return;
    }

    try {
      await handleChat(req, res, userId);
    } catch (err) {
      const g = guardrailBlock(err);
      if (g) {
        sendJson(res, 422, { error: g.reason, guardrail: g.name });
        return;
      }
      console.error("chat turn failed:", err);
      if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
      else res.destroy();
    }
    return;
  }

  sendJson(res, 404, { error: "not found" });
}

const server = http.createServer();
server.on("request", (req, res) => {
  void handle(req, res).catch((err) => {
    console.error("request failed:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
    else res.destroy();
  });
});

initStore(); // fire-and-forget; ensureStore() retries on every request until it succeeds

server.listen(config.port, () => {
  console.log(`triage-agent listening on ${config.port}`);
});
