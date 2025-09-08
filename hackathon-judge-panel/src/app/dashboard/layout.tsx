// app/dashboard/layout.tsx
import { auth } from '@clerk/nextjs/server';
import {UserButton} from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Trophy, Users, BarChart3, Upload } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Hackathon Judge Panel
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/scoring"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  <Trophy className="mr-3 h-5 w-5" />
                  Scoring
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/results"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Results
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/import"
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  <Upload className="mr-3 h-5 w-5" />
                  Import Data
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}