# amp-verify-agent — PRD

## Problem Statement

Support teams receive a steady stream of incoming tickets that must be read, prioritized, and answered. Sorting the urgent from the routine is manual and error-prone, and writing a first-draft reply for every ticket consumes most of an agent's time even when the eventual answer is routine. The result is slower response to the tickets that matter most, and agents spending effort on drafting rather than judgment.

## Solution

A support triage agent that reads each incoming ticket, classifies it by urgency, and drafts a reply — leaving a human support agent to review, edit if needed, and approve before anything is sent to the customer. Customers submit tickets directly in the product; approved replies are emailed back to them automatically.

## Actors

- **Customer** — submits support tickets and receives replies once a support agent approves them.
- **Support Agent** — reviews the queue of triaged tickets, reads the AI-classified urgency and AI-drafted reply for each, edits the draft as needed, and approves it for sending.

## User Stories

1. As a customer, I want to submit a support ticket describing my issue, so that I can get help.
2. As a support agent, I want incoming tickets to be automatically classified by urgency, so that I can prioritize my work.
3. As a support agent, I want to see my queue of tickets sorted by urgency, so that I address the most critical issues first.
4. As a support agent, I want an AI-drafted reply prepared for each ticket, so that I can respond quickly instead of writing from scratch.
5. As a support agent, I want to review and edit a drafted reply before it goes out, so that customers get an accurate, appropriate response.
6. As a support agent, I want to approve a reply once I'm satisfied with it, so that it is sent to the customer.
7. As a customer, I want to receive a reply to my ticket by email, so that I know my issue was addressed.

## Product Decisions

- **Ticket intake**: customers submit tickets directly within this product; there is no integration with an external helpdesk or shared inbox.
- **Actors**: the only human role is the support agent; there is no separate team-lead/admin role and no customer-facing account area beyond submitting a ticket and receiving its reply.
- **Reply delivery**: once a support agent approves a drafted reply, the product sends it to the customer itself, by email, using the organization's internal transactional email service.
- **Urgency scale**: tickets are classified into four levels — Low, Medium, High, Critical — so the queue can be sorted meaningfully.
- **Sign-in**: support agents sign in via SSO through Thunder, the platform identity provider (organization default). Customers submitting tickets do not need an account.

## Out of Scope

- Multi-channel ticket intake (phone, chat, social media) — email-only delivery of replies, web-only intake of tickets.
- SLA tracking, escalation timers, or breach alerts.
- Reporting or analytics dashboards on ticket volume, urgency trends, or agent performance.
- Ticket reassignment between agents or team/queue management.
- Automatic sending of a reply without a human approval step — the human-in-the-loop approval is mandatory for every reply.

## Open Questions

None at this time — all decisions above were assumed with a recommended default and are open to being changed.