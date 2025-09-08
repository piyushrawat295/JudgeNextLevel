// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { teams, scores, judges } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { Users, TrendingUp, Clock, Trophy } from 'lucide-react';

async function getJudgeStats(clerkId: string) {
  // First, ensure judge exists
  let judge = await db.query.judges.findFirst({
    where: eq(judges.clerkId, clerkId)
  });

  if (!judge) {
    const user = await currentUser();
    if (user) {
      [judge] = await db.insert(judges).values({
        clerkId: clerkId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          user.emailAddresses[0]?.emailAddress || 'Judge'
      }).returning();
    }
  }

  if (!judge) return null;

  // Get team stats
  const totalTeams = await db.select({ count: sql<number>`count(*)` })
    .from(teams)
    .then(result => result[0]?.count || 0);

  // Get scored teams count
  const scoredTeams = await db.select({ count: sql<number>`count(distinct ${scores.teamId})` })
    .from(scores)
    .where(eq(scores.judgeId, judge.id))
    .then(result => result[0]?.count || 0);

  // Get pending teams count
  const pendingTeams = totalTeams - scoredTeams;

  // Calculate completion rate
  const completionRate = totalTeams > 0 ? Math.round((scoredTeams / totalTeams) * 100) : 0;

  return {
    judge,
    totalTeams,
    scoredTeams,
    pendingTeams,
    completionRate
  };
}

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) return null;

  const stats = await getJudgeStats(userId);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const { judge, totalTeams, scoredTeams, pendingTeams, completionRate } = stats;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Teams Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {judge.name}! Here's your judging progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
              <p className="text-sm text-gray-600">Total Teams</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{scoredTeams}</p>
              <p className="text-sm text-green-700">Scored</p>
            </div>
            <Trophy className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{pendingTeams}</p>
              <p className="text-sm text-orange-700">Pending</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
              <p className="text-sm text-blue-700">Completion Rate</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Teams Status</h2>
        </div>
        <div className="p-6">
          {totalTeams === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No teams available
              </h3>
              <p className="text-gray-600 mb-6">
                Import team data to get started with judging.
              </p>
              <a
                href="/dashboard/import"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Import Team Data
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Progress: {scoredTeams} of {totalTeams} teams scored
                </span>
                <div className="flex space-x-2">
                  <a
                    href="/dashboard/scoring"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Scoring
                  </a>
                  <a
                    href="/dashboard/results"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    View Results
                  </a>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}