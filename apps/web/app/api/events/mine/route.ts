import { events } from "@attendance/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireOfficerFromRequest } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const officer = await requireOfficerFromRequest(request);
  if (!officer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myEvents = await db
    .select()
    .from(events)
    .where(eq(events.officerId, officer.id))
    .orderBy(desc(events.createdAt));

  return NextResponse.json({ events: myEvents });
}
