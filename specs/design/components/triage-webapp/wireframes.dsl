// Support triage — public intake + support-agent triage queue

screen SubmitTicket "A customer describes their issue and sends it in"
  navbar "TriageDesk"
  sidebar "Submit a ticket -> SubmitTicket"
  heading "Submit a Support Ticket"
  input "Your email — e.g. jane@example.com"
  input "Subject — e.g. Cannot log in"
  textarea "Describe your issue in detail"
  row
    right
    button "Submit ticket" primary -> TicketConfirmation

screen TicketConfirmation "Confirms the ticket was received and will be answered by email"
  navbar "TriageDesk"
  sidebar "Submit a ticket -> SubmitTicket"
  heading "Ticket Submitted"
  text "Thanks — we've received your ticket and will reply by email once a support agent reviews it."
  badge "Received" success

screen TriageQueue "Support agent reviews tickets sorted by urgency and opens one to respond"
  navbar "TriageDesk"
  sidebar "Triage Queue -> TriageQueue | Settings"
  row
    heading "Triage Queue"
    right
    select "Urgency: All"
  row
    card "Open tickets | 18 | across all urgencies"
    card "Critical | 2 | need immediate reply"
    card "High | 5 | review soon"
  tabs "All | Critical | High | Medium | Low"
  table "Subject | Customer | Urgency | Status | Received" -> TicketDetail
    row "Cannot log in | jane@example.com | Critical | Drafted | 5m ago"
    row "Billing question | sam@example.com | Medium | Drafted | 1h ago"
    row "Feature request | lee@example.com | Low | Drafted | 3h ago"

screen TicketDetail "Support agent reviews the AI draft, edits it, and approves it for sending"
  navbar "TriageDesk"
  sidebar "Triage Queue -> TriageQueue | Settings"
  breadcrumb "Triage Queue / Cannot log in"
  row
    heading "Cannot log in"
    badge "Critical" danger
    badge "Drafted" info
  text "From: jane@example.com — Received 5m ago"
  split 60/40
    left
      heading "Customer message"
      text "I can't log into my account since this morning. Please help urgently."
      heading "Drafted reply"
      textarea "Hi Jane, sorry for the trouble — I've reset your session, please try logging in again..."
      row
        right
        button "Save edits"
        button "Approve and send" primary  // in place — sends the reply and stays on this ticket
    right
      card "Ticket info"
        text "Urgency: Critical (AI-classified)"
        text "Status: Drafted"

flow "Submit a ticket"
  description "A customer submits a support ticket without signing in"
  SubmitTicket
  TicketConfirmation

flow "Triage queue"
  role "SupportAgent"
  description "A support agent reviews the queue and approves a reply"
  TriageQueue
  TicketDetail
