// components/ScoringInterface.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Star, Users } from 'lucide-react';
import { Team, Score, TeamMember } from '@/lib/db/schema';

interface TeamWithScore extends Team {
  score: Score | null;
}

interface ScoringInterfaceProps {
  teams: TeamWithScore[];
}

export default function ScoringInterface({ teams }: ScoringInterfaceProps) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [scores, setScores] = useState({
    innovation: 5,
    technical: 5,
    presentation: 5,
    impact: 5,
    overall: 5
  });
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentTeam = teams[currentTeamIndex];

  // Load existing scores when team changes
  useEffect(() => {
    if (currentTeam?.score) {
      setScores({
        innovation: currentTeam.score.innovation,
        technical: currentTeam.score.technical,
        presentation: currentTeam.score.presentation,
        impact: currentTeam.score.impact,
        overall: currentTeam.score.overall
      });
      setFeedback(currentTeam.score.feedback || '');
    } else {
      setScores({
        innovation: 5,
        technical: 5,
        presentation: 5,
        impact: 5,
        overall: 5
      });
      setFeedback('');
    }
    setSaveStatus('idle');
  }, [currentTeamIndex, currentTeam]);

  const handleScoreChange = (category: keyof typeof scores, value: number) => {
    setScores(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    if (!currentTeam) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: currentTeam.id,
          ...scores,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      setSaveStatus('success');
      
      // Move to next team after successful save
      setTimeout(() => {
        if (currentTeamIndex < teams.length - 1) {
          setCurrentTeamIndex(prev => prev + 1);
        }
      }, 1000);

    } catch (error) {
      console.error('Error saving score:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No teams available for scoring
        </h3>
        <p className="text-gray-600 mb-6">
          Import team data first to start scoring.
        </p>
        <a
          href="/dashboard/import"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Import Team Data
        </a>
      </div>
    );
  }

  const ScoreSlider = ({ 
    label, 
    category, 
    value, 
    description 
  }: { 
    label: string; 
    category: keyof typeof scores; 
    value: number;
    description: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-900">{label}</label>
        <span className="text-lg font-bold text-blue-600">{value}/10</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => handleScoreChange(category, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value - 1) * 11.11}%, #e5e7eb ${(value - 1) * 11.11}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl">
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Team {currentTeamIndex + 1} of {teams.length}
              </h2>
              <p className="text-gray-600">
                {teams.filter(t => t.score).length} scored, {teams.filter(t => !t.score).length} remaining
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentTeamIndex(prev => Math.max(0, prev - 1))}
                disabled={currentTeamIndex === 0}
                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentTeamIndex(prev => Math.min(teams.length - 1, prev + 1))}
                disabled={currentTeamIndex === teams.length - 1}
                className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentTeamIndex + 1) / teams.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {currentTeam?.score && (
                <Star className="w-5 h-5 text-green-500 mr-2 fill-current" />
              )}
              {currentTeam?.name}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed">
                {currentTeam?.description || 'No description provided'}
              </p>
            </div>

            {currentTeam?.members && currentTeam.members.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Team Members</h4>
                <div className="space-y-2">
                  {(currentTeam.members as TeamMember[]).map((member, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                      <span className="font-medium">{member.name}</span>
                      {member.role && (
                        <span className="text-sm text-gray-600">{member.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scoring Panel */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Score Team</h3>
          </div>
          <div className="p-6 space-y-6">
            <ScoreSlider
              label="Innovation"
              category="innovation"
              value={scores.innovation}
              description="Creativity and uniqueness of the solution"
            />

            <ScoreSlider
              label="Technical Implementation"
              category="technical"
              value={scores.technical}
              description="Code quality, architecture, and technical difficulty"
            />

            <ScoreSlider
              label="Presentation"
              category="presentation"
              value={scores.presentation}
              description="Demo quality and communication effectiveness"
            />

            <ScoreSlider
              label="Impact & Feasibility"
              category="impact"
              value={scores.impact}
              description="Potential real-world impact and market viability"
            />

            <ScoreSlider
              label="Overall Impression"
              category="overall"
              value={scores.overall}
              description="General evaluation of the project"
            />

            {/* Feedback */}
            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide constructive feedback for the team..."
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Score'}
              </button>

              {saveStatus === 'success' && (
                <p className="mt-2 text-sm text-green-600 text-center">
                  Score saved successfully!
                </p>
              )}

              {saveStatus === 'error' && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  Failed to save score. Please try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}