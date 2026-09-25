import ticket_api.email_service;

// email-service: external dependency, pinned contract at
// specs/design/dependencies/email-service/openapi.yaml. No authentication —
// called directly at its configured base URL.
// `email-service`'s base URL may be unset when this pod starts — no `check`,
// so a malformed/empty URL is captured as a value, never a panic that would
// crash-loop the pod.
final email_service:Client|error emailServiceClientOrError = new (serviceUrl = stripTrailingSlash(emailServiceBaseUrl));

function getEmailServiceClient() returns email_service:Client|error {
    email_service:Client|error result = emailServiceClientOrError;
    if result is error {
        return error("email-service is not configured yet");
    }
    return result;
}

function sendApprovedReplyEmail(string toEmail, string subject, string body) returns error? {
    email_service:Client emailServiceClient = check getEmailServiceClient();
    email_service:SendEmailRequest sendRequest = {to: toEmail, subject: subject, body: body};
    email_service:EmailMessage _ = check emailServiceClient->/emails.post(sendRequest);
}
