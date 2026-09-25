// wireframes.dsl: screen TriageQueue — "Support agent reviews tickets sorted
// by urgency and opens one to respond". Loads GET /tickets (tickets:read-all).
import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Grid,
  ListingTable,
  MenuItem,
  PageContent,
  PageTitle,
  Skeleton,
  Stack,
  StatCard,
  Tabs,
  Tab,
  TextField,
} from "@wso2/oxygen-ui";
import { ticketApi } from "../api";
import { ForbiddenError } from "../authz/client";
import type { components } from "../generated/ticket-api";
import { formatRelativeTime, statusLabel, urgencyRank } from "../lib/ticket";

type Ticket = components["schemas"]["Ticket"];
type UrgencyFilter = "All" | components["schemas"]["Ticket"]["urgency"];

const URGENCIES: UrgencyFilter[] = ["All", "Critical", "High", "Medium", "Low"];

export function TriageQueuePage(): JSX.Element {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("All");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data, error: apiError } = await ticketApi.GET("/tickets", {
          params: { query: { limit: 100 } },
        });
        if (!live) return;
        if (apiError) {
          setError(apiError.message ?? "The triage queue could not be loaded.");
          return;
        }
        setTickets(data?.data ?? []);
      } catch (err) {
        if (!live || err instanceof ForbiddenError) return;
        setError(err instanceof Error ? err.message : "The triage queue could not be loaded.");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Stats are over every OPEN ticket (not yet replied) — the queue's own
  // reach — regardless of the urgency filter the table below applies.
  const openTickets = useMemo(() => (tickets ?? []).filter((t) => t.status !== "replied"), [tickets]);
  const criticalCount = openTickets.filter((t) => t.urgency === "Critical").length;
  const highCount = openTickets.filter((t) => t.urgency === "High").length;

  const rows = useMemo(() => {
    const filtered =
      urgencyFilter === "All" ? (tickets ?? []) : (tickets ?? []).filter((t) => t.urgency === urgencyFilter);
    return [...filtered].sort((a, b) => {
      const byUrgency = urgencyRank(b.urgency) - urgencyRank(a.urgency);
      if (byUrgency !== 0) return byUrgency;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, urgencyFilter]);

  return (
    <>
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Triage Queue</PageTitle.Header>
          <PageTitle.Actions>
            <TextField
              select
              label="Urgency"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
              sx={{ minWidth: 160 }}
            >
              {URGENCIES.map((u) => (
                <MenuItem key={u} value={u}>
                  {u === "All" ? "All" : u}
                </MenuItem>
              ))}
            </TextField>
          </PageTitle.Actions>
        </PageTitle>

        {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label="Open tickets" value={tickets ? openTickets.length : "…"} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label="Critical" value={tickets ? criticalCount : "…"} iconColor="error" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard label="High" value={tickets ? highCount : "…"} iconColor="warning" />
          </Grid>
        </Grid>

        <Tabs
          value={urgencyFilter}
          onChange={(_e, value) => setUrgencyFilter(value as UrgencyFilter)}
          sx={{ mb: 2 }}
        >
          {URGENCIES.map((u) => (
            <Tab key={u} label={u} value={u} />
          ))}
        </Tabs>

        {tickets === null ? (
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
          </Stack>
        ) : (
          <ListingTable.Container>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Subject</ListingTable.Cell>
                  <ListingTable.Cell>Customer</ListingTable.Cell>
                  <ListingTable.Cell>Urgency</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                  <ListingTable.Cell>Received</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {rows.map((ticket) => (
                  <ListingTable.Row
                    key={ticket.id}
                    clickable
                    onClick={() => navigate(`/triage/${ticket.id}`)}
                  >
                    <ListingTable.Cell>{ticket.subject}</ListingTable.Cell>
                    <ListingTable.Cell>{ticket.customerEmail}</ListingTable.Cell>
                    <ListingTable.Cell>{ticket.urgency}</ListingTable.Cell>
                    <ListingTable.Cell>{statusLabel(ticket.status)}</ListingTable.Cell>
                    <ListingTable.Cell>{formatRelativeTime(ticket.createdAt)}</ListingTable.Cell>
                  </ListingTable.Row>
                ))}
                {rows.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={5}>
                      <ListingTable.EmptyState
                        title="No tickets"
                        description="No tickets match this urgency filter."
                      />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : null}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        )}
      </PageContent>
    </>
  );
}
