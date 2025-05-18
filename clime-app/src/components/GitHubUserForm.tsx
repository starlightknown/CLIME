'use client';

import { useState } from 'react';

type GitHubUserData = {
  name: string;
  login: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
};

type ScriptData = {
  scriptContent: string;
  command: string;
  userData: GitHubUserData;
  scriptUrl: string;
};

export default function GitHubUserForm() {
  const [username, setUsername] = useState('');
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);
    setCopiedUrl(false);
    
    try {
      const response = await fetch(`/api/whois/${username}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setScriptData(data);
    } catch (err) {
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setScriptData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'command' | 'url') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (type === 'command') {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub username"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="GitHub username"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
          >
            {isLoading ? 'Loading...' : 'Get Info'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}

      {scriptData && (
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center">
            <img 
              src={scriptData.userData.avatar_url} 
              alt={`${scriptData.userData.login} avatar`}
              className="w-16 h-16 rounded-full" 
            />
            <div>
              <h3 className="text-xl font-bold">{scriptData.userData.name || scriptData.userData.login}</h3>
              <a 
                href={`https://github.com/${scriptData.userData.login}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                @{scriptData.userData.login}
              </a>
              {scriptData.userData.bio && <p className="text-gray-600 mt-1">{scriptData.userData.bio}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span>Repos: {scriptData.userData.public_repos}</span>
                <span>Followers: {scriptData.userData.followers}</span>
                <span>Following: {scriptData.userData.following}</span>
              </div>
            </div>
          </div>

          {/* Command Display */}
          <div className="bg-black text-gray-200 p-4 rounded-md font-mono text-sm overflow-x-auto relative">
            <p className="text-green-400 mb-2 flex items-center">
              <span className="mr-2">$</span>
              {scriptData.command}
            </p>
            <button 
              onClick={() => copyToClipboard(scriptData.command, 'command')}
              className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          {/* Direct URL */}
          {scriptData.scriptUrl && (
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm overflow-x-auto relative">
              <p className="flex items-center">
                <span className="mr-2 text-yellow-300">Direct URL:</span>
                <a 
                  href={scriptData.scriptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline truncate"
                >
                  {scriptData.scriptUrl}
                </a>
              </p>
              <button 
                onClick={() => copyToClipboard(scriptData.scriptUrl, 'url')}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
              >
                {copiedUrl ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          
          {/* Script Output Preview */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Preview:</h3>
            <div className="bg-black text-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
              {scriptData.scriptContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 