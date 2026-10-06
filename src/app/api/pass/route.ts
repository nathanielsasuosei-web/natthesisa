import { NextResponse } from "next/server";

/**
 * Retired with the access pass: time is no longer sold, and passes open
 * nothing. The route stays so old clients get an explanation instead of a
 * 404 — students buy the program they want to study.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Access passes are no longer sold — buy the program you want to study instead.",
      code: "RETIRED_ITEM",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    retired: true,
    periods: [],
  });
}
