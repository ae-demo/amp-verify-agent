// One handler per ticket-api operation. State lives in module scope, reset on
// every full page load (react-webapp/mock-mode.md): a create shows up in the
// next list, an edit persists across in-app navigation, and a reload restores
// this seed. Paths carry the /api prefix exactly as src/api.ts calls them.
//
// NO scope check here — mock/authz/gateway.ts already refused a caller who may
// not call the operation, exactly as the real API gateway does; nothing here
// re-checks a handle.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/ticket-api";

type Ticket = components["schemas"]["Ticket"];
type TicketDetail = components["schemas"]["TicketDetail"];
type Reply = components["schemas"]["Reply"];
type NewTicket = components["schemas"]["NewTicket"];
type ReplyUpdate = components["schemas"]["ReplyUpdate"];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

interface SeedTicket {
  ticket: Ticket;
  body: string;
  reply: Reply;
}

let nextId = 7;

let store: SeedTicket[] = [
  {
    ticket: {
      id: "t-1",
      customerEmail: "jane@example.com",
      subject: "Cannot log in",
      urgency: "Critical",
      status: "triaged",
      createdAt: minutesAgo(5),
    },
    body: "I can't log into my account since this morning. Please help urgently.",
    reply: {
      id: "r-1",
      ticketId: "t-1",
      body: "Hi Jane, sorry for the trouble — I've reset your session, please try logging in again...",
      status: "draft",
      approvedAt: null,
      sentAt: null,
    },
  },
  {
    ticket: {
      id: "t-2",
      customerEmail: "sam@example.com",
      subject: "Billing question",
      urgency: "Medium",
      status: "triaged",
      createdAt: minutesAgo(60),
    },
    body: "I was charged twice for last month's invoice — can someone check my account?",
    reply: {
      id: "r-2",
      ticketId: "t-2",
      body: "Hi Sam, thanks for flagging this — I can see the duplicate charge and I've started a refund; it should land within 3-5 business days.",
      status: "draft",
      approvedAt: null,
      sentAt: null,
    },
  },
  {
    ticket: {
      id: "t-3",
      customerEmail: "lee@example.com",
      subject: "Feature request",
      urgency: "Low",
      status: "triaged",
      createdAt: minutesAgo(180),
    },
    body: "It would be great if the dashboard supported dark mode.",
    reply: {
      id: "r-3",
      ticketId: "t-3",
      body: "Hi Lee, thanks for the suggestion! I've passed dark mode along to our product team as a feature request.",
      status: "draft",
      approvedAt: null,
      sentAt: null,
    },
  },
  {
    ticket: {
      id: "t-4",
      customerEmail: "morgan@example.com",
      subject: "Payment gateway timeout",
      urgency: "High",
      status: "triaged",
      createdAt: minutesAgo(20),
    },
    body: "Checkout times out every time I try to pay with my card.",
    reply: {
      id: "r-4",
      ticketId: "t-4",
      body: "Hi Morgan, sorry about that — we're aware of intermittent gateway timeouts and are rolling out a fix; in the meantime, please try again in a few minutes.",
      status: "draft",
      approvedAt: null,
      sentAt: null,
    },
  },
  {
    ticket: {
      id: "t-5",
      customerEmail: "robin@example.com",
      subject: "Cannot reset password",
      urgency: "Critical",
      status: "triaged",
      createdAt: minutesAgo(2),
    },
    body: "The password reset email never arrives and I'm locked out.",
    reply: {
      id: "r-5",
      ticketId: "t-5",
      body: "Hi Robin, I've manually triggered a password reset email to your account — please check spam if it doesn't arrive within a few minutes.",
      status: "draft",
      approvedAt: null,
      sentAt: null,
    },
  },
  {
    ticket: {
      id: "t-6",
      customerEmail: "casey@example.com",
      subject: "Great support!",
      urgency: "Low",
      status: "replied",
      createdAt: minutesAgo(1440),
    },
    body: "Just wanted to say thanks for the quick help last week.",
    reply: {
      id: "r-6",
      ticketId: "t-6",
      body: "Hi Casey, thank you so much for the kind words — really glad we could help!",
      status: "sent",
      approvedAt: minutesAgo(1430),
      sentAt: minutesAgo(1430),
    },
  },
];

function findEntry(ticketId: string): SeedTicket | undefined {
  return store.find((entry) => entry.ticket.id === ticketId);
}

function toDetail(entry: SeedTicket): TicketDetail {
  return { ...entry.ticket, body: entry.body, reply: entry.reply };
}

export const handlers = [
  // Every ticket in the queue — guarded by tickets:read-all.
  http.get("/api/tickets", ({ request }) => {
    const url = new URL(request.url);
    const urgency = url.searchParams.get("urgency");
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    let data = store.map((entry) => entry.ticket);
    if (urgency) data = data.filter((t) => t.urgency === urgency);
    if (status) data = data.filter((t) => t.status === status);

    const count = data.length;
    const page = data.slice(offset, offset + limit);
    return HttpResponse.json({ count, next: null, previous: null, data: page });
  }),

  // A customer submits a new ticket — public (security: []). The synchronous
  // classify-and-draft step (ticket-submission.md) is modelled inline: every
  // created ticket comes back already `triaged`, with a drafted reply.
  http.post("/api/tickets", async ({ request }) => {
    const input = (await request.json().catch(() => null)) as Partial<NewTicket> | null;
    if (!input?.customerEmail?.trim() || !input?.subject?.trim() || !input?.body?.trim()) {
      return HttpResponse.json(
        { code: 400, message: "customerEmail, subject and body are all required" },
        { status: 400 },
      );
    }
    const id = `t-${nextId++}`;
    const ticket: Ticket = {
      id,
      customerEmail: input.customerEmail,
      subject: input.subject,
      urgency: "Medium",
      status: "triaged",
      createdAt: new Date().toISOString(),
    };
    const reply: Reply = {
      id: `r-${id}`,
      ticketId: id,
      body: `Hi there, thanks for reaching out about "${input.subject}" — we're looking into it and will follow up shortly.`,
      status: "draft",
      approvedAt: null,
      sentAt: null,
    };
    store = [...store, { ticket, body: input.body, reply }];
    return HttpResponse.json(ticket, { status: 201 });
  }),

  // A single ticket's detail, including its drafted reply — tickets:read-all.
  http.get("/api/tickets/:ticketId", ({ params }) => {
    const entry = findEntry(String(params.ticketId));
    if (!entry) {
      return HttpResponse.json({ code: 404, message: "No ticket with that id" }, { status: 404 });
    }
    return HttpResponse.json(toDetail(entry));
  }),

  // Edit the drafted reply — tickets:update.
  http.patch("/api/tickets/:ticketId/reply", async ({ params, request }) => {
    const entry = findEntry(String(params.ticketId));
    if (!entry) {
      return HttpResponse.json({ code: 404, message: "No ticket with that id" }, { status: 404 });
    }
    const input = (await request.json().catch(() => null)) as Partial<ReplyUpdate> | null;
    if (!input?.body?.trim()) {
      return HttpResponse.json({ code: 400, message: "body is required" }, { status: 400 });
    }
    if (entry.reply.status === "sent") {
      return HttpResponse.json(
        { code: 400, message: "This reply has already been sent and can no longer be edited" },
        { status: 400 },
      );
    }
    entry.reply = { ...entry.reply, body: input.body };
    return HttpResponse.json(entry.reply);
  }),

  // Approve the reply so it is sent — tickets:approve.
  http.post("/api/tickets/:ticketId/reply/approve", ({ params }) => {
    const entry = findEntry(String(params.ticketId));
    if (!entry) {
      return HttpResponse.json({ code: 404, message: "No ticket with that id" }, { status: 404 });
    }
    const now = new Date().toISOString();
    entry.reply = { ...entry.reply, status: "sent", approvedAt: entry.reply.approvedAt ?? now, sentAt: now };
    entry.ticket = { ...entry.ticket, status: "replied" };
    return HttpResponse.json(entry.reply);
  }),
];
