import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, judges } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface ImportTeamData {
  name: string;
  description: string;
  members: Array<{ name: string; role?: string }>;
}

interface TeamData {
  id: number;
  name: string;
  description: string;
  members: Array<{ name: string; role?: string }>;
  judgeId: number;
}

const skeletonTeam: TeamData = {
  id: 0,
  name: "Team Name",
  description: "",
  members: [],
  judgeId: 0,
};

function plainTeam(team: any): TeamData {
  return {
    id: team?.id ?? 0,
    name: team?.name ?? "Team Name",
    description: team?.description ?? "",
    members: Array.isArray(team?.members)
      ? team.members.map((m: any) => ({
          name: m?.name ?? "",
          role: m?.role ?? "",
        }))
      : [],
    judgeId: team?.judgeId ?? 0,
  };
}

// ---------------------
// POST: Import teams
// ---------------------
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teams: teamData }: { teams: ImportTeamData[] } = await req.json();
    if (!teamData || !Array.isArray(teamData))
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });

    // Get or create judge
    let judge = await db.query.judges.findFirst({ where: eq(judges.clerkId, userId) });
    if (!judge) {
      const user = await currentUser();
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      [judge] = await db.insert(judges).values({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.emailAddresses[0]?.emailAddress || "Judge",
      }).returning();
    }

    const insertedTeams: TeamData[] = [];

    for (const teamInfo of teamData) {
      if (!teamInfo.name) continue;

      // Check if team already exists for the same judge
      const existingTeam = await db.query.teams.findFirst({
        where: and(eq(teams.name, teamInfo.name), eq(teams.judgeId, judge.id)),
      });

      if (existingTeam) {
        console.log(`Skipping duplicate team: ${teamInfo.name}`);
        continue; // Skip duplicate team
      }

      // Insert only unique team
      const [insertedTeam] = await db.insert(teams).values({
        name: teamInfo.name,
        description: teamInfo.description || "",
        members: teamInfo.members || [],
        judgeId: judge.id,
      }).returning();

      insertedTeams.push(plainTeam(insertedTeam));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedTeams.length} unique teams`,
      teams: insertedTeams.length > 0 ? insertedTeams : [skeletonTeam],
    });
  } catch (error) {
    console.error("Team import error:", error);
    return NextResponse.json({ error: "Failed to process teams" }, { status: 500 });
  }
}

// ---------------------
// GET: Fetch teams
// ---------------------
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ teams: [skeletonTeam] });

    const judge = await db.query.judges.findFirst({ where: eq(judges.clerkId, userId) });
    if (!judge) return NextResponse.json({ teams: [skeletonTeam] });

    const allTeams = await db.query.teams.findMany({ where: eq(teams.judgeId, judge.id) });

    if (allTeams.length === 0) return NextResponse.json({ teams: [skeletonTeam] });

    return NextResponse.json({ teams: allTeams.map(plainTeam) });
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ teams: [skeletonTeam] }, { status: 500 });
  }
}
