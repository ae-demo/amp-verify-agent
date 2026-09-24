Feature: Triage queue and reply approval

  @story-3
  Rule: Only a signed-in support agent may view the triage queue

    Scenario: A support agent sees the queue sorted by urgency
      Given tickets exist with urgencies "Critical", "Medium", and "Low"
      When Omar the support agent, signed in, opens the triage queue
      Then the "Critical" ticket appears ahead of the "Medium" and "Low" tickets

    @negative
    Scenario: A visitor who is not signed in cannot see the queue
      Given tickets exist in the triage queue
      When a visitor who has not signed in tries to open the triage queue
      Then the queue contents are not shown to the visitor

  @story-4
  Rule: Every ticket has an AI-drafted reply ready before a support agent writes anything

    Scenario: A drafted reply is already present when the agent opens the ticket
      Given Priya has submitted a ticket with subject "Cannot log in"
      When Omar the support agent opens that ticket
      Then a drafted reply is already shown for the ticket

  @story-5
  Rule: A support agent can review and edit a drafted reply before it is sent

    Scenario: Editing the drafted reply
      Given a ticket has a drafted reply
      When Omar the support agent changes the drafted reply's text
      Then the ticket's reply now holds Omar's edited text

  @story-6
  Rule: A reply is only sent once a support agent approves it

    Scenario: Approving a reply
      Given a ticket has a drafted reply that has not been approved
      When Omar the support agent approves the reply
      Then the reply's status is approved

    @negative
    Scenario: An unapproved reply is never sent
      Given a ticket has a drafted reply that has not been approved
      When no support agent has approved the reply
      Then the reply has not been sent to the customer

  @story-7
  Rule: The customer receives the approved reply by email

    Scenario: The customer is emailed once the reply is approved
      Given Priya's ticket has a drafted reply
      When Omar the support agent approves the reply
      Then an email carrying the approved reply is sent to "priya@example.com"

    Scenario: An edited reply is what gets emailed
      Given Priya's ticket has a drafted reply
      When Omar the support agent edits the reply and then approves it
      Then the email sent to "priya@example.com" carries Omar's edited text, not the original draft
