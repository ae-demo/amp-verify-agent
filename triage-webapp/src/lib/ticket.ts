// Shared display helpers for the triage screens. Kept out of the pages so the
// urgency ranking and status wording are defined exactly once.
import type { components } from "../generated/ticket-api";

export type Urgency = components["schemas"]["Urgency"];
export type TicketStatus = components["schemas"]["Ticket"]["status"];
export type ReplyStatus = components["schemas"]["Reply"]["status"];

// Higher first, as the queue's stat cards and table both require.
const URGENCY_RANK: Record<Urgency, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export function urgencyRank(urgency: Urgency): number {
  return URGENCY_RANK[urgency];
}

export function urgencyColor(urgency: Urgency): "error" | "warning" | "info" | "success" {
  switch (urgency) {
    case "Critical":
      return "error";
    case "High":
      return "warning";
    case "Medium":
      return "info";
    case "Low":
      return "success";
  }
}

/**
 * The contract's Ticket.status is submitted | triaged | replied — there is no
 * "Drafted" value. wireframes.dsl's demo rows show "Drafted" for a ticket
 * whose AI draft is ready to review, which is what `triaged` means once the
 * triage-agent has classified it and written a reply: reworded here rather
 * than left as the raw enum value, per `wireframes/references/implementing.md`
 * ("rename only when the wording is wrong for the data the API actually
 * returns, and say so in the report").
 */
export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "triaged":
      return "Drafted";
    case "replied":
      return "Sent";
  }
}

export function statusColor(status: TicketStatus): "default" | "info" | "success" {
  switch (status) {
    case "submitted":
      return "default";
    case "triaged":
      return "info";
    case "replied":
      return "success";
  }
}

export function replyStatusLabel(status: ReplyStatus): string {
  switch (status) {
    case "draft":
      return "Drafted";
    case "approved":
      return "Approved";
    case "sent":
      return "Sent";
  }
}

export function replyStatusColor(status: ReplyStatus): "info" | "warning" | "success" {
  switch (status) {
    case "draft":
      return "info";
    case "approved":
      return "warning";
    case "sent":
      return "success";
  }
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSeconds < 60) return "just now";
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
