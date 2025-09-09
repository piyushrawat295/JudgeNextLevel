"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import { toast } from "sonner";

type Team = {
  id: number;
  name: string;
  description: string;
  members: { name: string; role?: string }[];
  hasScores: boolean;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data.teams || []);
    } catch {
      toast.error("Failed to fetch teams ❌");
    }
  }

  async function handleDelete(teamId: number) {
    try {
      const res = await fetch("/api/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: [teamId] }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Team deleted ✅");
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
      } else {
        toast.error(data.error || "Failed to delete team ❌");
      }
    } catch {
      toast.error("Failed to delete team ❌");
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Manage Teams</h1>

      <section>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 && (
            <p className="text-gray-500 col-span-full">No teams available</p>
          )}
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col justify-between p-4 border rounded-xl bg-white shadow hover:shadow-lg transition-shadow duration-200"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{team.name}</p>
                  <Badge
                    className={
                      team.hasScores
                        ? "bg-blue-500 text-white"
                        : "bg-red-500 text-white"
                    }
                  >
                    {team.hasScores ? "Scored" : "Unscored"}
                  </Badge>
                </div>
                <p className="text-gray-600">{team.description}</p>
                <p className="text-sm text-gray-400">
                  Members: {team.members.map((m) => m.name).join(", ") || "—"}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-black flex items-center justify-center space-x-2 border-black hover:bg-red-600 hover:text-white transition-colors duration-200 cursor-pointer group"
                onClick={() => handleDelete(team.id)}
              >
                <Trash className="w-4 h-4 text-red-600 group-hover:text-white transition-colors duration-200" />
                <span>Delete</span>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
