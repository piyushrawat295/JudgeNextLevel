// app/api/scores/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scores, judges } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function plainScore(score: any) {
  return {
    ...score,
    team: score.team || null,
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const judge = await db.query.judges.findFirst({ where: eq(judges.clerkId, userId) });
  if (!judge) return NextResponse.json({ error: "Judge not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { teamId, innovation, technical, presentation, impact, overall, feedback } = body;

    const scoreValues = [innovation, technical, presentation, impact, overall];
    if (scoreValues.some((s) => s < 1 || s > 10 || !Number.isInteger(s))) {
      return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
    }

    const existingScore = await db.query.scores.findFirst({
      where: and(eq(scores.teamId, teamId), eq(scores.judgeId, judge.id)),
    });

    let savedScore;
    if (existingScore) {
      const res = await db
        .update(scores)
        .set({ innovation, technical, presentation, impact, overall, feedback, updatedAt: new Date() })
        .where(eq(scores.id, existingScore.id))
        .returning();
      savedScore = res[0];
    } else {
      const res = await db
        .insert(scores)
        .values({ teamId, judgeId: judge.id, innovation, technical, presentation, impact, overall, feedback })
        .returning();
      savedScore = res[0];
    }

    return NextResponse.json({ success: true, score: plainScore(savedScore) });
  } catch (error) {
    console.error("POST /api/scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const judge = await db.query.judges.findFirst({ where: eq(judges.clerkId, userId) });
  if (!judge) return NextResponse.json({ error: "Judge not found" }, { status: 404 });

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    if (teamId) {
      const score = await db.query.scores.findFirst({
        where: and(eq(scores.teamId, parseInt(teamId)), eq(scores.judgeId, judge.id)),
        with: { team: true },
      });
      return NextResponse.json({ score: score ? plainScore(score) : null });
    }

    const allScores = await db.query.scores.findMany({
      where: eq(scores.judgeId, judge.id),
      with: { team: true },
    });

    const plainScores = allScores.map(plainScore);
    return NextResponse.json({ scores: plainScores });
  } catch (error) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
