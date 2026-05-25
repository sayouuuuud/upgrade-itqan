import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { onCompetitionAwardTopN } from "@/lib/certificate/eligibility"

// POST /api/academy/admin/competitions/[id]/award-top-n
//
// Triggers eligibility for the top N (configured per-competition via
// `award_top_n`).  Each top-N entry gets an issuance request created
// in `data_required` state and is notified.  Idempotent.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (
    !session ||
    !["admin", "academy_admin"].includes(session.role || "")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  try {
    const result = await onCompetitionAwardTopN({
      scope: "academy",
      competitionId: id,
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error("[competitions/award-top-n] failed", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    )
  }
}
