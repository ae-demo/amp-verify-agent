import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// A row of the `tickets` table.
public type TicketRow record {|
    string id;
    string customerEmail;
    string subject;
    string body;
    string urgency;
    string status;
    time:Utc createdAt;
|};

// A row of the `replies` table.
public type ReplyRow record {|
    string id;
    string ticketId;
    string body;
    string status;
    time:Utc? approvedAt;
    time:Utc? sentAt;
|};

final int ticketDbPortNum = ticketDbPort == "" ? 5432 : check int:fromString(ticketDbPort);

// `ticket-db` is a platform-resource provisioning gate: its env vars may be
// unset (or the database may not be reachable yet) when this pod starts, and
// the component contract requires the service to start regardless — no
// `check` here, so a connection failure is captured as a value, never a panic
// that would crash-loop the pod. Every query goes through `getDb()`, which
// turns that captured error into a per-request 500 instead.
final postgresql:Client|error ticketDbOrError = new (
    host = ticketDbHost,
    port = ticketDbPortNum,
    username = ticketDbUser,
    password = ticketDbPassword,
    database = ticketDbName
);

final error? schemaInitResult = initSchemaIfReady();

function initSchemaIfReady() returns error? {
    postgresql:Client|error dbResult = ticketDbOrError;
    if dbResult is error {
        // Not configured or not reachable yet — surfaced per-request by
        // getDb() instead of failing startup.
        return ();
    }
    postgresql:Client db = dbResult;
    sql:ExecutionResult _ = check db->execute(`
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            customer_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            urgency TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
    sql:ExecutionResult _ = check db->execute(`
        CREATE TABLE IF NOT EXISTS replies (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL REFERENCES tickets (id),
            body TEXT NOT NULL,
            status TEXT NOT NULL,
            approved_at TIMESTAMPTZ,
            sent_at TIMESTAMPTZ
        )
    `);
}

function getDb() returns postgresql:Client|error {
    postgresql:Client|error dbResult = ticketDbOrError;
    if dbResult is error {
        return error("ticket-db is not configured or not reachable yet");
    }
    return dbResult;
}

function insertTicket(TicketRow ticket) returns error? {
    postgresql:Client db = check getDb();
    sql:ExecutionResult _ = check db->execute(`
        INSERT INTO tickets (id, customer_email, subject, body, urgency, status, created_at)
        VALUES (${ticket.id}, ${ticket.customerEmail}, ${ticket.subject}, ${ticket.body},
                ${ticket.urgency}, ${ticket.status}, ${ticket.createdAt})
    `);
}

function insertReply(ReplyRow reply) returns error? {
    postgresql:Client db = check getDb();
    sql:ExecutionResult _ = check db->execute(`
        INSERT INTO replies (id, ticket_id, body, status, approved_at, sent_at)
        VALUES (${reply.id}, ${reply.ticketId}, ${reply.body}, ${reply.status},
                ${reply.approvedAt}, ${reply.sentAt})
    `);
}

function findTicketById(string ticketId) returns TicketRow|error {
    postgresql:Client db = check getDb();
    TicketRow row = check db->queryRow(`
        SELECT id, customer_email AS "customerEmail", subject, body, urgency, status,
               created_at AS "createdAt"
        FROM tickets WHERE id = ${ticketId}
    `);
    return row;
}

function findReplyByTicketId(string ticketId) returns ReplyRow|error {
    postgresql:Client db = check getDb();
    ReplyRow row = check db->queryRow(`
        SELECT id, ticket_id AS "ticketId", body, status,
               approved_at AS "approvedAt", sent_at AS "sentAt"
        FROM replies WHERE ticket_id = ${ticketId}
    `);
    return row;
}

// Every matching ticket, urgency-first (Critical..Low) then oldest-first
// within the same urgency, for the triage queue.
function listTickets(string? urgency, string? status, int pageLimit, int pageOffset) returns TicketRow[]|error {
    sql:ParameterizedQuery query = `
        SELECT id, customer_email AS "customerEmail", subject, body, urgency, status,
               created_at AS "createdAt"
        FROM tickets WHERE 1 = 1
    `;
    if urgency is string {
        query = sql:queryConcat(query, ` AND urgency = ${urgency}`);
    }
    if status is string {
        query = sql:queryConcat(query, ` AND status = ${status}`);
    }
    query = sql:queryConcat(query, `
        ORDER BY CASE urgency
            WHEN 'Critical' THEN 4
            WHEN 'High' THEN 3
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 1
            ELSE 0
        END DESC, created_at ASC
        LIMIT ${pageLimit} OFFSET ${pageOffset}
    `);
    postgresql:Client db = check getDb();
    stream<TicketRow, sql:Error?> resultStream = db->query(query);
    TicketRow[] rows = [];
    error? e = resultStream.forEach(function(TicketRow row) {
        rows.push(row);
    });
    if e is error {
        return e;
    }
    return rows;
}

function countTickets(string? urgency, string? status) returns int|error {
    sql:ParameterizedQuery query = `SELECT COUNT(*) AS rowCount FROM tickets WHERE 1 = 1`;
    if urgency is string {
        query = sql:queryConcat(query, ` AND urgency = ${urgency}`);
    }
    if status is string {
        query = sql:queryConcat(query, ` AND status = ${status}`);
    }
    postgresql:Client db = check getDb();
    record {| int rowCount; |} result = check db->queryRow(query);
    return result.rowCount;
}

// The number of rows updated — 0 means no reply exists for `ticketId`.
function updateReplyBody(string ticketId, string newBody) returns int|error {
    postgresql:Client db = check getDb();
    sql:ExecutionResult result = check db->execute(`
        UPDATE replies SET body = ${newBody} WHERE ticket_id = ${ticketId}
    `);
    int? affected = result.affectedRowCount;
    return affected is int ? affected : 0;
}

function markReplyApproved(string ticketId, time:Utc approvedAt) returns error? {
    postgresql:Client db = check getDb();
    sql:ExecutionResult _ = check db->execute(`
        UPDATE replies SET status = 'approved', approved_at = ${approvedAt} WHERE ticket_id = ${ticketId}
    `);
}

function markReplySent(string ticketId, time:Utc sentAt) returns error? {
    postgresql:Client db = check getDb();
    sql:ExecutionResult _ = check db->execute(`
        UPDATE replies SET status = 'sent', sent_at = ${sentAt} WHERE ticket_id = ${ticketId}
    `);
}

function markTicketStatus(string ticketId, string status) returns error? {
    postgresql:Client db = check getDb();
    sql:ExecutionResult _ = check db->execute(`
        UPDATE tickets SET status = ${status} WHERE id = ${ticketId}
    `);
}
