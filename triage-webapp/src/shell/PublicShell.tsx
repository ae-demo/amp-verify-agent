// The public, no-sign-in chrome for SubmitTicket / TicketConfirmation —
// wireframes.dsl's navbar "TriageDesk" + sidebar "Submit a ticket -> SubmitTicket"
// on both screens. No account cluster: nobody is signed in on this flow.
import type { JSX, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AppShell,
  ColorSchemeToggle,
  Footer,
  Header,
  Sidebar,
} from "@wso2/oxygen-ui";
import { Mail } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";

export function PublicShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <AppShell>
      <AppShell.Navbar>
        <Header minimal>
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Sidebar>
        <Sidebar activeItem="submit-ticket">
          <Sidebar.Nav>
            <Sidebar.Category>
              <Sidebar.Item id="submit-ticket" link={<Link to="/" />}>
                <Sidebar.ItemIcon>
                  <Mail size={18} />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>Submit a ticket</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </AppShell.Sidebar>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}
