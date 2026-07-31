"use server";

import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import {
  createEvent as createEventCommand,
  EventLifecycleError,
  parseEventInput,
} from "@/lib/events";

function fail(message: string): never {
  redirect(`/events?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
  const actor = await requireOfficerOrGovernor();
  const input = parseEventInput({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    halfDayPenaltyAmount: String(formData.get("halfDayPenaltyAmount") ?? ""),
    date: String(formData.get("date") ?? ""),
    venue: String(formData.get("venue") ?? "").trim() || undefined,
  });

  try {
    await createEventCommand(actor, input);
  } catch (error) {
    if (error instanceof EventLifecycleError) fail(error.message);
    throw error;
  }
  redirect("/events");
}
