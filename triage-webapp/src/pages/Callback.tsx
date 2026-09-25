// The OIDC redirect target for BOTH the redirect and silent-renew legs
// (thunder-authentication: one registered redirect URI serves both).
// `handleCallback()` dispatches on the stored request_type and settles;
// this page renders from that promise settling, not from a value.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, ParticleBackground, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void handleCallback()
      .then(() => {
        // "/" is the public SubmitTicket screen (customers, no session); the
        // only signed-in landing this app has is the triage queue.
        if (live) navigate("/triage", { replace: true });
      })
      .catch((err) => {
        console.error("authz: sign-in callback failed", err);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <Layout.Content>
      <ParticleBackground opacity={0.5} />
      <Typography variant="h6">{APP_NAME}</Typography>
      <Typography>{failed ? "Sign-in did not complete. Please try again." : "Signing you in…"}</Typography>
    </Layout.Content>
  );
}
