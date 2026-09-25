// wireframes.dsl: screen TicketDetail — "Support agent reviews the AI draft,
// edits it, and approves it for sending". Loads GET /tickets/{ticketId}
// (tickets:read-all); Save edits calls PATCH .../reply (tickets:update);
// Approve and send calls POST .../reply/approve (tickets:approve).
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AppBreadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  PageContent,
  PageTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";
import { ticketApi } from "../api";
import { ForbiddenError } from "../authz/client";
import type { components } from "../generated/ticket-api";
import { formatRelativeTime, replyStatusColor, replyStatusLabel, urgencyColor } from "../lib/ticket";

type TicketDetail = components["schemas"]["TicketDetail"];

export function TicketDetailPage(): JSX.Element {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let live = true;
    if (!ticketId) return;
    (async () => {
      try {
        const { data, error: apiError } = await ticketApi.GET("/tickets/{ticketId}", {
          params: { path: { ticketId } },
        });
        if (!live) return;
        if (apiError) {
          setLoadError(apiError.message ?? "That ticket could not be found.");
          return;
        }
        if (data) {
          setTicket(data);
          setReplyBody(data.reply.body);
        }
      } catch (err) {
        if (!live || err instanceof ForbiddenError) return;
        setLoadError(err instanceof Error ? err.message : "That ticket could not be loaded.");
      }
    })();
    return () => {
      live = false;
    };
  }, [ticketId]);

  async function handleSaveEdits(): Promise<void> {
    if (!ticketId || !ticket) return;
    setSaving(true);
    setActionError(null);
    setSaved(false);
    try {
      const { data, error: apiError } = await ticketApi.PATCH("/tickets/{ticketId}/reply", {
        params: { path: { ticketId } },
        body: { body: replyBody },
      });
      if (apiError) {
        setActionError(apiError.message ?? "The reply could not be saved.");
        return;
      }
      if (data) {
        setTicket({ ...ticket, reply: data });
        setSaved(true);
      }
    } catch (err) {
      if (err instanceof ForbiddenError) return;
      setActionError(err instanceof Error ? err.message : "The reply could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(): Promise<void> {
    if (!ticketId || !ticket) return;
    setApproving(true);
    setActionError(null);
    try {
      const { data, error: apiError } = await ticketApi.POST("/tickets/{ticketId}/reply/approve", {
        params: { path: { ticketId } },
      });
      if (apiError) {
        setActionError(apiError.message ?? "The reply could not be approved.");
        return;
      }
      if (data) {
        setTicket({ ...ticket, reply: data });
      }
    } catch (err) {
      if (err instanceof ForbiddenError) return;
      setActionError(err instanceof Error ? err.message : "The reply could not be approved.");
    } finally {
      setApproving(false);
    }
  }

  if (loadError) {
    return (
      <PageContent>
        <Alert severity="error">{loadError}</Alert>
      </PageContent>
    );
  }

  if (!ticket) {
    return (
      <PageContent>
        <Skeleton variant="rounded" height={300} />
      </PageContent>
    );
  }

  const sent = ticket.reply.status === "sent";

  return (
    <PageContent>
      <AppBreadcrumbs
        items={[
          { key: "queue", label: "Triage Queue", onClick: () => navigate("/triage") },
          { key: "detail", label: ticket.subject },
        ]}
        sx={{ mb: 2 }}
      />

      <PageTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PageTitle.Header>{ticket.subject}</PageTitle.Header>
          <Chip label={ticket.urgency} color={urgencyColor(ticket.urgency)} size="small" />
          <Chip label={replyStatusLabel(ticket.reply.status)} color={replyStatusColor(ticket.reply.status)} size="small" />
        </Stack>
      </PageTitle>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        From: {ticket.customerEmail} — Received {formatRelativeTime(ticket.createdAt)}
      </Typography>

      {actionError ? <Alert severity="error" sx={{ mb: 3 }}>{actionError}</Alert> : null}
      {saved ? <Alert severity="success" sx={{ mb: 3 }}>Edits saved.</Alert> : null}
      {sent ? <Alert severity="success" sx={{ mb: 3 }}>Reply approved and sent to the customer.</Alert> : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Customer message
          </Typography>
          <Typography sx={{ mb: 3 }}>{ticket.body}</Typography>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Drafted reply
          </Typography>
          <TextField
            multiline
            minRows={6}
            fullWidth
            value={replyBody}
            disabled={sent}
            onChange={(e) => {
              setReplyBody(e.target.value);
              setSaved(false);
            }}
          />
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Can op="PATCH /tickets/{ticketId}/reply">
              <Button
                variant="outlined"
                disabled={saving || sent || replyBody.trim() === ""}
                onClick={() => void handleSaveEdits()}
              >
                {saving ? "Saving…" : "Save edits"}
              </Button>
            </Can>
            <Can op="POST /tickets/{ticketId}/reply/approve">
              <Button
                variant="contained"
                disabled={approving || sent}
                onClick={() => void handleApprove()}
              >
                {sent ? "Sent" : approving ? "Approving…" : "Approve and send"}
              </Button>
            </Can>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader title="Ticket info" />
            <CardContent>
              <Typography>Urgency: {ticket.urgency} (AI-classified)</Typography>
              <Typography>Status: {replyStatusLabel(ticket.reply.status)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContent>
  );
}
