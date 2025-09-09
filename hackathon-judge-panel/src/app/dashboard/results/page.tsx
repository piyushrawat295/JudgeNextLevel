// app/dashboard/results/page.tsx
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { teams, scores, judges } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { Trophy, Users, TrendingUp, Clock } from 'lucide-react';

async function getHackathonResults(clerkId: string) {
  const judge = await db.query.judges.findFirst({
    where: eq(judges.clerkId, clerkId),
  });

  if (!judge) return null;

  const teamsWithScores = await db
    .select({
      team: teams,
      score: scores,
    })
    .from(teams)
    .leftJoin(scores, eq(scores.teamId, teams.id))
    .orderBy(
      desc(
        sql`CASE WHEN ${scores.id} IS NOT NULL THEN (${scores.innovation} + ${scores.technical} + ${scores.presentation} + ${scores.impact} + ${scores.overall})/5.0 ELSE 0 END`
      )
    );

  const rankings = teamsWithScores.map((entry) => {
    const avgScore =
      entry.score &&
      [entry.score.innovation, entry.score.technical, entry.score.presentation, entry.score.impact, entry.score.overall]
        .filter((v) => typeof v === 'number')
        .reduce((a, b) => a + b, 0) / 5;

    return { ...entry, avgScore };
  });

  const totalTeams = rankings.length;
  const scoredTeams = rankings.filter((t) => t.score).length;
  const pendingTeams = totalTeams - scoredTeams;
  const completionRate = totalTeams > 0 ? Math.round((scoredTeams / totalTeams) * 100) : 0;

  return { totalTeams, scoredTeams, pendingTeams, completionRate, rankings };
}

export default async function ResultsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const results = await getHackathonResults(userId);
  if (!results) return <div>Loading...</div>;

  const { totalTeams, scoredTeams, pendingTeams, completionRate, rankings } = results;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hackathon Results</h1>
        <p className="text-gray-600 mt-1">Final rankings and team performance overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
              <p className="text-sm text-gray-600">Total Teams</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{scoredTeams}</p>
              <p className="text-sm text-green-700">Teams Scored</p>
            </div>
            <Trophy className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{pendingTeams}</p>
              <p className="text-sm text-orange-700">Pending Review</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
              <p className="text-sm text-blue-700">Completion Rate</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Team Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Team Rankings
          </h2>
        </div>
        <div className="p-6">
          {scoredTeams === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams have been scored yet.</h3>
              <p className="text-gray-600 mb-6">Start scoring teams to see the rankings here.</p>
              <a
                href="/dashboard/scoring"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Scoring
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {rankings.map((entry, index) => {
                const { team, score, avgScore } = entry;
                const rank = score ? index + 1 : null;
                const isScored = !!score;

                return (
                  <div
                    key={`${team.id}-${index}`}
                    className={`border rounded-lg p-6 ${isScored ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          {rank && (
                            <div className="flex-shrink-0">
                              {rank <= 3 ? (
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                    rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-500'
                                  }`}
                                >
                                  {rank}
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                  {rank}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                            <p className="text-gray-600 mt-1">{team.description || 'No description provided'}</p>

                            {team.members && team.members.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-500 mb-1">Team Members:</p>
                                <div className="flex flex-wrap gap-2">
                                  {team.members.map((member, memberIndex) => (
                                    <span
                                      key={memberIndex}
                                      className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                    >
                                      {member.name}
                                      {member.role && ` - ${member.role}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 text-right">
                        {isScored ? (
                          <>
                            <div className="text-2xl font-bold text-blue-600">
                              {typeof avgScore === 'number' ? avgScore.toFixed(1) : 'N/A'}/10
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Average Score</div>

                            {/* Individual Scores */}
                            <div className="mt-4 space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Innovation:</span>
                                <span className="font-medium">{score.innovation}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Technical:</span>
                                <span className="font-medium">{score.technical}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Presentation:</span>
                                <span className="font-medium">{score.presentation}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Impact:</span>
                                <span className="font-medium">{score.impact}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Overall:</span>
                                <span className="font-medium">{score.overall}/10</span>
                              </div>
                            </div>

                            {score.feedback && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Feedback:</strong> {score.feedback}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="text-gray-400 text-lg">—</div>
                            <div className="text-sm text-gray-500">Not scored</div>
                            <a
                              href="/dashboard/scoring"
                              className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Score team →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
