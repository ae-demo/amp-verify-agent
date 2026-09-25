// window._env_ for mock mode — exactly the keys the platform actually emits
// for this component (src/env.ts's Env type): the `user-auth` OIDC keys. No
// sibling API URL — that is same-origin /api, never a browser key.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // OIDC scopes are `group` and `ou`, singular — not `groups` — followed by
  // every catalog handle security.json declares for this project.
  USER_AUTH_SCOPES: "openid profile email group ou tickets:read-all tickets:update tickets:approve",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
