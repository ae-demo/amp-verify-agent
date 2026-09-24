Feature: Ticket submission

  @story-1
  Rule: A customer can submit a support ticket without signing in

    Scenario: Submitting a complete ticket
      Given Priya the customer has not signed in
      When Priya submits a ticket with her email "priya@example.com", subject "Cannot log in", and a description of her issue
      Then a new ticket exists for "priya@example.com" with subject "Cannot log in"

    @negative
    Scenario: A ticket missing its description is refused
      Given Priya the customer has not signed in
      When Priya submits a ticket with her email "priya@example.com" and subject "Cannot log in" but leaves the description empty
      Then no new ticket is created for "priya@example.com"

  @story-2
  Rule: Every submitted ticket is automatically classified by urgency

    Scenario: A newly submitted ticket is triaged without human action
      Given Priya has submitted a ticket with subject "Site is down for me"
      When no support agent has yet looked at the ticket
      Then the ticket already has an urgency level assigned
