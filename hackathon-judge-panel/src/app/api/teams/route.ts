import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, scores } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

// ✅ GET: Fetch all teams with global hasScores flag
export async function GET() {
  try {
    // Fetch all teams
    const allTeams = await db.select().from(teams);

    // Fetch all team IDs that have at least one score (from any judge)
    const scored = await db.select({ teamId: scores.teamId })
      .from(scores);

    const scoredTeamIds = scored.map((s) => s.teamId);

    // Mark each team whether it has scores globally
    const formattedTeams = allTeams.map((t) => ({
      ...t,
      hasScores: scoredTeamIds.includes(t.id),
    }));

    return NextResponse.json({ teams: formattedTeams }, { status: 200 });
  } catch (error) {
    console.error("GET /api/teams Error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// ✅ DELETE: Delete only unscored teams
export async function DELETE(req: Request) {
  try {
    const { teamIds } = await req.json();
    if (!teamIds || teamIds.length === 0) {
      return NextResponse.json({ error: "No teams selected for deletion" }, { status: 400 });
    }

    // Fetch all scored team IDs
    const scored = await db.select({ teamId: scores.teamId })
      .from(scores)
      .where(inArray(scores.teamId, teamIds));

    const scoredTeamIds = scored.map((s) => s.teamId);

    // Filter only unscored teams
    const unscoredIds = teamIds.filter((id: number) => !scoredTeamIds.includes(id));
    if (unscoredIds.length === 0) {
      return NextResponse.json({ error: "Selected teams have scores and cannot be deleted" }, { status: 400 });
    }

    // Delete unscored teams
    await db.delete(teams).where(inArray(teams.id, unscoredIds));

    return NextResponse.json(
      { message: `${unscoredIds.length} unscored team(s) deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/teams Error:", error);
    return NextResponse.json({ error: "Failed to delete teams" }, { status: 500 });
  }
}
