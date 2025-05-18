'use client';

import { useState } from 'react';
import { FiTerminal, FiCopy, FiGithub, FiSearch, FiExternalLink, FiInfo } from 'react-icons/fi';

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
  theme: string;
};

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  icon: string;
  requiresInstall?: boolean;
};

const themes: ThemeOption[] = [
  { 
    id: 'clean', 
    name: 'Clean', 
    description: 'No decoration, just text', 
    detailedDescription: 'Outputs a clean script with no ASCII art or decoration, just the profile information.',
    icon: '📝' 
  },
  { 
    id: 'linux', 
    name: 'Linux', 
    description: 'Penguin ASCII art', 
    detailedDescription: 'Adds a fun ASCII penguin to your script. Works in any terminal!',
    icon: '🐧' 
  },
  { 
    id: 'funny', 
    name: 'Cowsay', 
    description: 'Uses cowsay command', 
    detailedDescription: 'Uses the cowsay command if installed on the user&apos;s system. If not, provides install instructions.',
    icon: '🐮',
    requiresInstall: true
  },
  { 
    id: 'retro', 
    name: 'Figlet', 
    description: 'Big text banner art', 
    detailedDescription: 'Uses the figlet command to create large text banners if installed. If not, provides install instructions.',
    icon: '👾',
    requiresInstall: true
  },
];

export default function GitHubUserForm() {
  const [username, setUsername] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('clean');
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showThemeInfo, setShowThemeInfo] = useState<string | null>(null);

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
    setCopiedScript(false);
    
    try {
      const response = await fetch(`/api/whois/${username}?theme=${selectedTheme}`);
      
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

  const copyToClipboard = (text: string, type: 'command' | 'url' | 'script') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (type === 'command') {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else if (type === 'url') {
          setCopiedUrl(true);
          setTimeout(() => setCopiedUrl(false), 2000);
        } else {
          setCopiedScript(true);
          setTimeout(() => setCopiedScript(false), 2000);
        }
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="text-gray-200">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-center w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 focus-within:border-blue-500 transition mb-4">
          <div className="pl-4 pr-2 text-gray-400">
            <FiGithub size={20} />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub username..."
            className="flex-1 px-2 py-3 bg-transparent border-none focus:outline-none text-gray-200 font-mono"
            aria-label="GitHub username"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <FiSearch className="mr-2" />
            )}
            {isLoading ? 'Loading...' : 'Generate'}
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="text-gray-300 block">Choose a theme:</label>
            <button 
              type="button"
              onClick={() => setShowThemeInfo(null)}
              className="ml-2 text-gray-400 hover:text-gray-200 text-xs underline"
            >
              What are these?
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themes.map((theme) => (
              <div 
                key={theme.id}
                className={`border p-3 rounded-lg cursor-pointer transition-all ${
                  selectedTheme === theme.id 
                    ? 'border-blue-500 bg-blue-500/20' 
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                }`}
                onClick={() => setSelectedTheme(theme.id)}
                onMouseEnter={() => setShowThemeInfo(theme.id)}
                onMouseLeave={() => setShowThemeInfo(null)}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-1">{theme.icon}</span>
                  <span className="font-medium">{theme.name}</span>
                  <div className="text-xs text-gray-400">
                    {theme.description}
                    {theme.requiresInstall && (
                      <span className="flex items-center justify-center mt-1 text-amber-400">
                        <FiInfo size={10} className="mr-1" />
                        Requires installation
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Theme Info Tooltip */}
          {showThemeInfo && (
            <div className="mt-3 p-3 bg-gray-800 rounded-md border border-gray-700 text-sm">
              <h4 className="font-medium mb-1 text-blue-400">
                {themes.find(t => t.id === showThemeInfo)?.name} Theme
              </h4>
              <p className="text-gray-300">
                {themes.find(t => t.id === showThemeInfo)?.detailedDescription}
              </p>
              {themes.find(t => t.id === showThemeInfo)?.requiresInstall && (
                <p className="mt-2 text-amber-400 text-xs">
                  Note: This theme uses terminal tools that may need to be installed on the user&apos;s system. 
                  The script will check for these and show installation instructions if needed.
                </p>
              )}
            </div>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-6 rounded-md" role="alert">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {scriptData && (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700">
            <div className="p-5 flex gap-4 items-center">
              <div className="relative">
                <img 
                  src={scriptData.userData.avatar_url} 
                  alt={`${scriptData.userData.login} avatar`}
                  className="w-20 h-20 rounded-lg border-2 border-blue-500" 
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1">
                  <FiGithub size={14} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">{scriptData.userData.name || scriptData.userData.login}</h3>
                <a 
                  href={`https://github.com/${scriptData.userData.login}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center"
                >
                  @{scriptData.userData.login}
                  <span className="ml-1"><FiExternalLink size={14} /></span>
                </a>
                {scriptData.userData.bio && <p className="text-gray-400 mt-1">{scriptData.userData.bio}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>{scriptData.userData.public_repos} repos</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{scriptData.userData.followers} followers</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{scriptData.userData.following} following</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Badge */}
          {scriptData.theme !== 'clean' && (
            <div className="flex items-center">
              <span className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center">
                <span className="mr-1">
                  {themes.find(t => t.id === scriptData.theme)?.icon || '🎨'}
                </span>
                Theme: {themes.find(t => t.id === scriptData.theme)?.name || scriptData.theme}
                {themes.find(t => t.id === scriptData.theme)?.requiresInstall && (
                  <span className="ml-2 text-xs text-amber-300">(Requires installation)</span>
                )}
              </span>
            </div>
          )}

          {/* Command Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center text-blue-400">
              <span className="mr-2"><FiTerminal /></span>
              Bash Command
            </h3>
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 font-mono text-sm overflow-x-auto relative group">
              <pre className="whitespace-pre-wrap text-gray-300">
                <code>{scriptData.command}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(scriptData.command, 'command')}
                className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded transition-all opacity-90 hover:opacity-100 flex items-center"
              >
                <span className="mr-1"><FiCopy size={16} /></span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          {/* Direct URL */}
          {scriptData.scriptUrl && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center text-purple-400">
                <span className="mr-2"><FiExternalLink /></span>
                Direct Script URL
              </h3>
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 font-mono text-sm overflow-x-auto relative">
                <a 
                  href={scriptData.scriptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline truncate block"
                >
                  {scriptData.scriptUrl}
                </a>
                <button 
                  onClick={() => copyToClipboard(scriptData.scriptUrl, 'url')}
                  className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded transition-all opacity-90 hover:opacity-100 flex items-center"
                >
                  <span className="mr-1"><FiCopy size={16} /></span>
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
          
          {/* Script Output Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center text-green-400">
              <span className="mr-2"><FiTerminal /></span>
              Script Preview
            </h3>
            <div className="bg-black rounded-lg border border-gray-700 p-4 font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto relative">
              <pre>
                <code className="text-green-400">{scriptData.scriptContent}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(scriptData.scriptContent, 'script')}
                className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded transition-all opacity-90 hover:opacity-100 flex items-center"
              >
                <span className="mr-1"><FiCopy size={16} /></span>
                {copiedScript ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 