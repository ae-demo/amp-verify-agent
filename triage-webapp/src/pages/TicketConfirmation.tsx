// wireframes.dsl: screen TicketConfirmation — "Confirms the ticket was
// received and will be answered by email". Public, no operation of its own.
import type { JSX } from "react";
import { Chip, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";
import { PublicShell } from "../shell/PublicShell";

export function TicketConfirmationPage(): JSX.Element {
  return (
    <PublicShell>
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Ticket Submitted</PageTitle.Header>
        </PageTitle>
        <Stack spacing={2} alignItems="flex-start">
          <Typography>
            Thanks — we&apos;ve received your ticket and will reply by email once a support
            agent reviews it.
          </Typography>
          <Chip label="Received" color="success" />
        </Stack>
      </PageContent>
    </PublicShell>
  );
}
