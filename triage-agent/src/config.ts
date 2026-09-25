// Single place every other module reads env through. Read by name, at
// startup — never a scattered process.env access per call site.

export const config = {
  port: Number(process.env.PORT ?? 9090),

  // Model access — injected by the platform for every ai-agent component.
  modelEndpoint: process.env.MODEL_ENDPOINT,
  modelName: process.env.MODEL_NAME,
  modelApiKey: process.env.MODEL_API_KEY,
  // Temporary override — see building.md "MODEL_API_KEY_HEADER".
  modelApiKeyHeader: process.env.MODEL_API_KEY_HEADER,

  // Conversation store — the memory-db platform-resource dependency.
  // Absence is not a fault: it means the in-memory backing is used instead
  // (local run / build-time evaluation). See store.ts.
  memoryDbHost: process.env.MEMORY_DB_HOST,
  memoryDbPort: process.env.MEMORY_DB_PORT,
  memoryDbName: process.env.MEMORY_DB_DBNAME,
  memoryDbUser: process.env.MEMORY_DB_USER,
  memoryDbPassword: process.env.MEMORY_DB_PASSWORD,

  // Tracing — inert unless both are set. See tracing.ts.
  otelEndpoint: process.env.AMP_OTEL_ENDPOINT,
  otelApiKey: process.env.AMP_AGENT_API_KEY,
  otelServiceName: process.env.OTEL_SERVICE_NAME ?? "triage-agent",
};

/** Env vars a fully-configured agent must have to serve a turn. Reported by
 * /healthz's `missing`; MEMORY_DB_* is deliberately never listed here — its
 * absence selects the in-memory store, not a broken configuration. */
export function missingRequiredEnv(): string[] {
  const missing: string[] = [];
  if (!config.modelEndpoint) missing.push("MODEL_ENDPOINT");
  if (!config.modelName) missing.push("MODEL_NAME");
  if (!config.modelApiKey) missing.push("MODEL_API_KEY");
  return missing;
}
