// Typed read of window._env_, the platform's runtime config — populated by
// /env-config.js at request time, never at build time. See react-webapp's
// Constraints: no import.meta.env.VITE_*, no process.env.*, no .env files.

type Env = {
  // The `user-auth` platform-resource dependency (thunder-authentication). All
  // four are required at sign-in time; RESOURCE is not optional — without it
  // the token's `aud` is wrong and every /api call 401s while sign-in looks
  // healthy. USER_AUTH_JWKS_URL is emitted too, but the browser never
  // validates a token — the API gateway does — so it is not declared here.
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
