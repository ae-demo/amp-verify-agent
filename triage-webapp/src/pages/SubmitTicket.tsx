// wireframes.dsl: screen SubmitTicket — "A customer describes their issue and
// sends it in". Public: no sign-in. Primary action -> TicketConfirmation.
import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { PublicShell } from "../shell/PublicShell";
import { ticketApi } from "../api";
import { ForbiddenError } from "../authz/client";

export function SubmitTicketPage(): JSX.Element {
  const navigate = useNavigate();
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = customerEmail.trim() !== "" && subject.trim() !== "" && body.trim() !== "";

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: apiError } = await ticketApi.POST("/tickets", {
        body: { customerEmail, subject, body },
      });
      if (apiError) {
        setError(apiError.message ?? "The ticket could not be submitted.");
        return;
      }
      navigate("/confirmation", { state: { ticket: data } });
    } catch (err) {
      if (err instanceof ForbiddenError) return;
      setError(err instanceof Error ? err.message : "The ticket could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Submit a Support Ticket</PageTitle.Header>
        </PageTitle>

        <form onSubmit={handleSubmit} noValidate>
          <Form.Section>
            <Form.Stack spacing={3}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label="Your email"
                placeholder="jane@example.com"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                fullWidth
              />
              <TextField
                label="Subject"
                placeholder="Cannot log in"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
              />
              <TextField
                label="Describe your issue in detail"
                multiline
                minRows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth
              />
              <Stack direction="row" justifyContent="flex-end">
                <Button type="submit" variant="contained" disabled={!canSubmit || submitting}>
                  {submitting ? "Submitting…" : "Submit ticket"}
                </Button>
              </Stack>
            </Form.Stack>
          </Form.Section>
        </form>
      </PageContent>
    </PublicShell>
  );
}
