// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS (thunder-authentication §5).
// Each row names the operation the screen LOADS — the call whose answer it
// renders on open, or, for a form that only writes, the call its submit
// makes. A screen is reachable when the caller may call that operation;
// nothing else decides it.
//
// Order matches wireframes.dsl's screen order: SubmitTicket, TicketConfirmation
// (both public — the "Submit a ticket" flow carries no `role` line), then
// TriageQueue, TicketDetail (the "Triage queue" flow, role SupportAgent).

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  {
    key: "submit-ticket",
    label: "Submit a ticket",
    path: "/",
    loads: "POST /tickets",
    public: true,
  },
  {
    key: "ticket-confirmation",
    label: "Ticket Submitted",
    path: "/confirmation",
    loads: null,
    public: true,
  },
  {
    key: "triage-queue",
    label: "Triage Queue",
    path: "/triage",
    loads: "GET /tickets",
  },
  {
    key: "ticket-detail",
    label: "Ticket Detail",
    path: "/triage/:ticketId",
    loads: "GET /tickets/{ticketId}",
  },
];

// FAIL LOUDLY at module load — a committed operations.gen.ts that went stale
// against a contract nobody regenerated from must not silently gate on
// nothing.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some(
    (screen) => !screen.public && screen.loads !== null,
  );
}
