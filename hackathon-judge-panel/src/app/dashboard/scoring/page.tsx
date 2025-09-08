import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { teams, scores, judges } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import ScoringInterface from '@/components/ScoringInterface';

async function getTeamsForScoring(clerkId: string) {
  // Get judge
  const judge = await db.query.judges.findFirst({
    where: eq(judges.clerkId, clerkId)
  });

  if (!judge) return [];

  // Get all teams with their scores
  const teamsWithScores = await db
    .select({
      team: teams,
      score: scores
    })
    .from(teams)
    .leftJoin(scores, and(
      eq(scores.teamId, teams.id),
      eq(scores.judgeId, judge.id)
    ))
    .orderBy(teams.name);

  return teamsWithScores.map(({ team, score }) => ({
    ...team,
    score: score || null
  }));
}

export default async function ScoringPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }

  const teamsData = await getTeamsForScoring(userId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Scoring</h1>
        <p className="text-gray-600 mt-1">
          Score and evaluate hackathon teams across multiple criteria.
        </p>
      </div>

      <ScoringInterface teams={teamsData} />
    </div>
  );
}