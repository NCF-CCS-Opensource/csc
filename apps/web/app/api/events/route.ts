import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import {
  createEvent,
  EventLifecycleError,
  parseEventInput,
} from "@/lib/events";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  try {
    const created = await createEvent(
      authorization.actor,
      parseEventInput(await request.json()),
    );
    return NextResponse.json({ event: { ...created, attendeeCount: 0 } });
  } catch (error) {
    if (error instanceof EventLifecycleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
