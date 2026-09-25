import ballerina/http;
import ballerina/lang.regexp;

// triage-agent is an ai-agent, not an OpenAPI service: one fixed contract,
// POST /chat taking { conversationId?, message } and returning
// { conversationId, text, toolCalls }. Hand-written against that shape.

type ChatRequest record {|
    string message;
|};

// Open record: the response also carries `toolCalls`, which this service
// never reads.
type ChatResponse record {
    string conversationId;
    string text;
};

// The urgency + drafted reply this service stores on the ticket, once
// triage-agent's free-text `text` is parsed.
public type TriageResult record {|
    string urgency;
    string reply;
|};

// `triage-agent`'s URL may be unset when this pod starts (its dependency is
// resolved by the platform at deploy time) — no `check`, so a malformed/empty
// URL is captured as a value, never a panic that would crash-loop the pod.
final http:Client|error triageAgentClientOrError = new (stripTrailingSlash(triageAgentUrl));

function getTriageAgentClient() returns http:Client|error {
    http:Client|error result = triageAgentClientOrError;
    if result is error {
        return error("triage-agent is not configured or not reachable yet");
    }
    return result;
}

// Case-insensitive "<label>:" markers, whichever order triage-agent's prompt
// happens to emit them in.
final string:RegExp URGENCY_LABEL = re `[Uu][Rr][Gg][Ee][Nn][Cc][Yy]\s*:`;
final string:RegExp REPLY_LABEL = re `[Rr][Ee][Pp][Ll][Yy]\s*:`;

// Classifies a newly submitted ticket by asking triage-agent for its urgency
// and a drafted reply. `ticketId` is the new ticket's own id, sent as
// `x-user-id` — triage-agent's required per-conversation scoping identity,
// unrelated to this service's own caller. No `conversationId` is sent: every
// ticket starts a fresh conversation.
//
// Returns an `error` (never a partial result) when triage-agent is
// unreachable, answers a non-2xx, or its reply cannot be parsed — the caller
// is required to fail the whole ticket submission rather than store an
// unclassified ticket.
function classifyTicket(string ticketId, string subject, string body) returns TriageResult|error {
    http:Client triageAgentClient = check getTriageAgentClient();
    ChatRequest chatRequest = {message: subject + "\n\n" + body};
    ChatResponse chatResponse = check triageAgentClient->post(
        "/chat",
        chatRequest,
        headers = {"x-user-id": ticketId}
    );
    return parseTriageResponse(chatResponse.text);
}

// Tolerant, case-insensitive parse of triage-agent's free-text reply. Accepts
// either label first — everything after one label, up to wherever the other
// one starts (or the end of the text), is that label's value.
function parseTriageResponse(string text) returns TriageResult|error {
    regexp:Span? urgencySpan = URGENCY_LABEL.find(text);
    regexp:Span? replySpan = REPLY_LABEL.find(text);
    if urgencySpan is () || replySpan is () {
        return error("triage-agent reply named no Urgency/Reply label: " + text);
    }

    int urgencyValueEnd = replySpan.startIndex > urgencySpan.startIndex ? replySpan.startIndex : text.length();
    string urgencyValueText = text.substring(urgencySpan.endIndex, urgencyValueEnd);
    string? urgencyWord = firstWord(urgencyValueText);
    string? urgency = urgencyWord is string ? canonicalUrgency(urgencyWord) : ();
    if urgency is () {
        return error("triage-agent reply's urgency label did not name Low/Medium/High/Critical: " + text);
    }

    int replyValueEnd = urgencySpan.startIndex > replySpan.startIndex ? urgencySpan.startIndex : text.length();
    string reply = text.substring(replySpan.endIndex, replyValueEnd).trim();
    if reply == "" {
        return error("triage-agent reply's reply label carried no text: " + text);
    }

    return {urgency, reply};
}

function firstWord(string text) returns string? {
    regexp:Span? span = re `[A-Za-z]+`.find(text);
    if span is regexp:Span {
        return span.substring();
    }
    return ();
}

function canonicalUrgency(string word) returns string? {
    string lower = word.toLowerAscii();
    if lower == "low" {
        return "Low";
    }
    if lower == "medium" {
        return "Medium";
    }
    if lower == "high" {
        return "High";
    }
    if lower == "critical" {
        return "Critical";
    }
    return ();
}
