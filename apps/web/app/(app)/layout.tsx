import { AppShell } from "./app-shell";
import { getIdentity } from "@/lib/queries/identity";

// The server shell resolves identity once via getIdentity() -> getCurrentStudent(),
// the same call the page's own requireCapability gate makes; React's cache()
// dedupes both to one upstream fetch per request (issue #285). The client
// AppShell seeds its query cache from this result instead of re-fetching.
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const identity = await getIdentity();
  return <AppShell initialIdentity={identity}>{children}</AppShell>;
}
