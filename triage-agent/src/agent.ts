// The AI SDK loop. No tools: the design's Scope says this agent needs
// nothing beyond the model call itself — it holds no ticket data beyond its
// own conversation store, so there is no dependency to generate a tool from.
import { generateText, stepCountIs, type ModelMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { config } from "./config.js";
import { SYSTEM_PROMPT, MAX_ITERATIONS } from "./prompt.js";
import { tracer } from "./tracing.js";

// Model provider — agent.afm.md's `model.provider` is "anthropic".
// MODEL_API_KEY_HEADER is a temporary override for Agent Manager's governed
// proxy; see building.md "MODEL_API_KEY_HEADER — a temporary override".
function buildModel() {
  const baseURL = config.modelEndpoint;
  const apiKey = config.modelApiKey ?? "";
  const keyHeader = config.modelApiKeyHeader;
  const anthropic = createAnthropic(
    keyHeader
      ? { baseURL, apiKey: "unused", headers: { [keyHeader]: apiKey } }
      : { baseURL, apiKey },
  );
  return anthropic(config.modelName ?? "claude-sonnet-5");
}

export interface TurnResult {
  text: string;
  toolCalls: unknown[];
  responseMessages: ModelMessage[];
}

export async function runTurn(messages: ModelMessage[]): Promise<TurnResult> {
  const model = buildModel();
  const modelName = config.modelName ?? "claude-sonnet-5";

  return tracer.startActiveSpan(`chat ${modelName}`, async (span) => {
    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages,
        stopWhen: stepCountIs(MAX_ITERATIONS),
      });
      span.setAttributes({
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": modelName,
        "gen_ai.usage.input_tokens": result.usage?.inputTokens ?? 0,
        "gen_ai.usage.output_tokens": result.usage?.outputTokens ?? 0,
      });
      return {
        text: result.text,
        toolCalls: result.toolCalls,
        responseMessages: result.steps.flatMap((s) => s.response.messages),
      };
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: 2 }); // ERROR
      throw err;
    } finally {
      span.end(); // a span never ended is a span never exported
    }
  });
}
