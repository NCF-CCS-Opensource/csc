import { eventsSnapshot } from "./actions";
import { EventsView } from "./events-view";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Server shell still does the read, so a cold visit's source has the Events in
  // it; the client child seeds its cache from this result (ADR 0013).
  const [snapshot, { error }] = await Promise.all([eventsSnapshot(), searchParams]);
  return <EventsView initialData={snapshot} error={error} />;
}
