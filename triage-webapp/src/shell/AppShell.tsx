// The signed-in support agent's shell — wireframes.dsl's navbar "TriageDesk" +
// sidebar "Triage Queue -> TriageQueue | Settings", drawn on TriageQueue and
// TicketDetail. Settings names a section this wireframe set does not draw, so
// it renders inert (react-webapp / wireframes: a rail item with no target is
// context, not a broken link).
import type { JSX } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { Inbox, LogOut, Settings as SettingsIcon } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const active = pathname.startsWith("/triage") ? "triage-queue" : "";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Support agent"} />
              <UserMenu.Header name={username || "Support agent"} email={username} />
              <UserMenu.Logout
                icon={<LogOut size={18} />}
                label="Sign out"
                onClick={() => void signOut()}
              />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active} onSelect={(id) => id === "triage-queue" && navigate("/triage")}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Sidebar.Item id="triage-queue" link={<Link to="/triage" />}>
                <Sidebar.ItemIcon>
                  <Inbox size={18} />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Triage Queue</Sidebar.ItemLabel>
              </Sidebar.Item>
              {/* "Settings" — the wireframe names it with no arrow: a section
                  this set does not draw. Rendered, left inert. */}
              <Sidebar.Item id="settings">
                <Sidebar.ItemIcon>
                  <SettingsIcon size={18} />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Settings</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
