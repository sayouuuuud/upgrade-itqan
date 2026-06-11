import { NextRequest } from "next/server"
import { listSubmissions, reviewSubmission } from "@/lib/tajweed-path-review"

export const dynamic = "force-dynamic"

// GET /api/admin/tajweed-paths/[id]/submissions — list pending submissions
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return listSubmissions(req, id)
}

// POST /api/admin/tajweed-paths/[id]/submissions — approve/reject a submission
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return reviewSubmission(req, id)
}
