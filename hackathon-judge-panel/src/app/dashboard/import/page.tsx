// app/dashboard/import/page.tsx
'use client';

import { useState } from 'react';
import { Upload, FileText, Users } from 'lucide-react';
import Papa from 'papaparse';

interface TeamData {
  team_name?: string;
  name?: string;
  description?: string;
  project_description?: string;
  member1_name?: string;
  member1_role?: string;
  member2_name?: string;
  member2_role?: string;
  member3_name?: string;
  member3_role?: string;
  member4_name?: string;
  member4_role?: string;
  member5_name?: string;
  member5_role?: string;
  members?: string; // For comma-separated format
}

export default function ImportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewData, setPreviewData] = useState<TeamData[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please upload a CSV file');
      setUploadStatus('error');
      return;
    }

    setIsLoading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as TeamData[];
          setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview

          // Validate required columns
          const requiredFields = ['team_name', 'name'];
          const hasRequired = data.some(row => 
            requiredFields.some(field => row[field as keyof TeamData])
          );

          if (!hasRequired) {
            setErrorMessage('CSV must contain either "team_name" or "name" column');
            setUploadStatus('error');
            setIsLoading(false);
            return;
          }

          // Transform and send data to API
          const transformedData = data.map(row => {
            const members = [];
            
            // Handle individual member columns
            for (let i = 1; i <= 5; i++) {
              const nameKey = `member${i}_name` as keyof TeamData;
              const roleKey = `member${i}_role` as keyof TeamData;
              
              if (row[nameKey]) {
                members.push({
                  name: row[nameKey] as string,
                  role: row[roleKey] as string || ''
                });
              }
            }

            // Handle comma-separated members format
            if (row.members && members.length === 0) {
              const membersList = row.members.split(',').map(m => m.trim());
              membersList.forEach(member => {
                if (member) {
                  members.push({ name: member, role: '' });
                }
              });
            }

            return {
              name: (row.team_name || row.name) as string,
              description: (row.description || row.project_description) as string,
              members
            };
          });

          // Send to API
          const response = await fetch('/api/teams/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teams: transformedData }),
          });

          if (!response.ok) {
            throw new Error('Failed to import teams');
          }

          const result = await response.json();
          setUploadStatus('success');
          
          // Reset form after success
          setTimeout(() => {
            setUploadStatus('idle');
            setPreviewData([]);
            if (event.target) {
              event.target.value = '';
            }
          }, 3000);

        } catch (error) {
          console.error('Error importing teams:', error);
          setErrorMessage('Failed to import teams. Please try again.');
          setUploadStatus('error');
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setErrorMessage('Error parsing CSV file. Please check the format.');
        setUploadStatus('error');
        setIsLoading(false);
      }
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Team Data</h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file or import directly from Google Sheets containing team information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <div className="flex space-x-4">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Upload
                </button>
                <button className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md opacity-50 cursor-not-allowed">
                  <FileText className="w-4 h-4 mr-2" />
                  Google Sheets
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload CSV File
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drop your CSV file here or click to browse files
                  </p>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Choose File'}
                    </button>
                  </div>
                </div>

                {/* Status Messages */}
                {uploadStatus === 'success' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">Teams imported successfully!</p>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{errorMessage}</p>
                  </div>
                )}

                {/* Import Button */}
                {previewData.length > 0 && uploadStatus === 'idle' && (
                  <div className="mt-6">
                    <button
                      onClick={() => {/* Import logic already handled in file upload */}}
                      disabled={isLoading}
                      className="flex items-center justify-center w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {isLoading ? 'Importing Teams...' : `Import ${previewData.length} Teams`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
                <p className="text-sm text-gray-600">First 5 rows of your CSV file</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Team Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Members
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((team, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {team.team_name || team.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                            {team.description || team.project_description || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {team.members ? 
                              team.members.split(',').length + ' members' : 
                              'N/A'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Requirements Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                CSV Format Requirements
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-100 px-1 rounded">team_name</code> or <code className="bg-gray-100 px-1 rounded">name</code></li>
                    <li>• <code className="bg-gray-100 px-1 rounded">description</code> or <code className="bg-gray-100 px-1 rounded">project_description</code></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Team Members (Option 1):</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-100 px-1 rounded">member1_name</code>, <code className="bg-gray-100 px-1 rounded">member1_role</code></li>
                    <li>• <code className="bg-gray-100 px-1 rounded">member2_name</code>, <code className="bg-gray-100 px-1 rounded">member2_role</code></li>
                    <li>• <code className="bg-gray-100 px-1 rounded">member3_name</code>, <code className="bg-gray-100 px-1 rounded">member3_role</code></li>
                    <li>• etc...</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Team Members (Option 2):</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code className="bg-gray-100 px-1 rounded">members</code> column with format:</li>
                    <li className="ml-4 text-xs">
                      "John Doe, Jane Smith, Bob Wilson"
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <strong>Note:</strong> Column names are case-insensitive. The system will automatically detect and map your columns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
            