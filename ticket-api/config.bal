import ballerina/os;

// ticket-db (platform-resource: postgres-cnpg) — envBindings from design.json,
// verbatim.
configurable string ticketDbHost = os:getEnv("TICKET_DB_HOST");
configurable string ticketDbPort = os:getEnv("TICKET_DB_PORT");
configurable string ticketDbName = os:getEnv("TICKET_DB_DBNAME");
configurable string ticketDbUser = os:getEnv("TICKET_DB_USER");
configurable string ticketDbPassword = os:getEnv("TICKET_DB_PASSWORD");

// triage-agent (component dependency) — one fixed endpoint, POST /chat.
configurable string triageAgentUrl = os:getEnv("TRIAGE_AGENT_URL");

// email-service (external dependency) — base URL, no auth required.
configurable string emailServiceBaseUrl = os:getEnv("EMAIL_SERVICE_BASE_URL");
