// Typed client for ticket-api, generated from its openapi.yaml. Same-origin
// baseUrl: nginx (in this pod) reverse-proxies /api to the sibling, through the
// API gateway when it is available. See src/authz/client.ts for the bearer +
// 401 handling this middleware delegates to — this file adds nothing of its
// own about authorization.
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/ticket-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const ticketApi = createClient<paths>({ baseUrl: "/api" });
ticketApi.use(authMiddleware);
