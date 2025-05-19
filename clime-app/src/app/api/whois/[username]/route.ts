import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

const execPromise = promisify(exec);

const JOKE_API_URL = 'https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single';
const SUPPORTED_THEMES = ['linux', 'funny', 'retro', 'clean'] as const;
type ThemeType = typeof SUPPORTED_THEMES[number];

// ASCII Art for Linux theme
const PENGUIN_ART = `
   .--.
  |o_o |
  |:_/ |
 //   \\ \\
(|     | )
/'\\_   _/\`\\
\\___)=(___/
`;

// Common installation messages for terminal tools
const INSTALLATION_MESSAGES = {
  cowsay: [
    "cowsay is not installed. Installing it would require:",
    "brew install cowsay # on macOS",
    "apt-get install cowsay # on Ubuntu/Debian",
    "yum install cowsay # on CentOS/RHEL"
  ],
  figlet: [
    "figlet is not installed. Installing it would require:",
    "brew install figlet # on macOS",
    "apt-get install figlet # on Ubuntu/Debian",
    "yum install figlet # on CentOS/RHEL"
  ]
};

// Define terminal style constants
const TERMINAL_STYLES = {
  // Background colors
  BG_GRAY: '\\033[48;5;240m',
  BG_BLUE: '\\033[48;5;39m',
  BG_GREEN: '\\033[48;5;35m',
  BG_PURPLE: '\\033[48;5;99m',
  BG_RED: '\\033[48;5;196m',
  BG_ORANGE: '\\033[48;5;208m',
  // Text colors
  WHITE: '\\033[97m',
  RESET: '\\033[0m',
  // Padding
  PAD: '  '
};

/**
 * Handle API request for GitHub user profile script
 */
export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  try {
    // Next.js docs recommend awaiting params in async routes
    const { username } = await Promise.resolve(context.params);
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    const theme = validateTheme(new URL(request.url).searchParams.get('theme'));
    
    try {
      const userData = await fetchGitHubUserData(username);
      const jokeText = theme === 'funny' ? await fetchProgrammingJoke() : '';
      
      const themeScript = generateThemeScript(theme, username, jokeText);
      const scriptContent = generateCompleteScript(themeScript, username, theme, userData);
      
      const scriptUrl = await uploadScriptToHost(scriptContent, username);
      const command = generateCommand(scriptContent, scriptUrl);

      return NextResponse.json({ 
        username,
        scriptContent,
        command,
        userData,
        scriptUrl: scriptUrl || '',
        theme
      });
    } catch (apiError) {
      // Handle GitHub API errors with appropriate status code
      if (apiError instanceof Error && apiError.message.includes('GitHub API error')) {
        const statusMatch = apiError.message.match(/(\d+)$/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 500;
        
        return NextResponse.json({ 
          error: status === 404 
            ? `GitHub user '${username}' not found` 
            : `GitHub API error: ${status}`
        }, { status });
      }
      
      // Rethrow other errors to be caught by outer catch block
      throw apiError;
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

function validateTheme(themeParam: string | null): ThemeType {
  return (SUPPORTED_THEMES.includes(themeParam as ThemeType) 
    ? themeParam 
    : 'clean') as ThemeType;
}


async function fetchGitHubUserData(username: string) {
  try {
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    
    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }
    
    return await userResponse.json();
  } catch (error) {
    // Add better error handling for network issues
    if (!(error instanceof Error) || !error.message.includes('GitHub API error')) {
      console.error('Network error fetching GitHub data:', error);
      throw new Error(`GitHub API network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    throw error;
  }
}

/**
 * Fetch a programming joke from the API
 */
async function fetchProgrammingJoke(): Promise<string> {
  try {
    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const jokeResponse = await fetch(JOKE_API_URL, { 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    if (!jokeResponse.ok) {
      console.warn(`Joke API returned status ${jokeResponse.status}`);
      return '';
    }
    
    const jokeData = await jokeResponse.json();
    
    // Check if joke exists in the response
    if (!jokeData || typeof jokeData.joke !== 'string') {
      console.warn('Joke API response missing joke field or has unexpected format');
      return '';
    }
    
    return jokeData.joke;
  } catch (error) {
    // Don't let joke errors interrupt the main flow
    console.error('Error fetching joke:', error);
    return '';
  }
}

/**
 * Generate theme-specific script content
 */
function generateThemeScript(theme: ThemeType, username: string, jokeText: string): string {
  switch(theme) {
    case 'linux':
      return `# Linux Theme
cat << "EOF"
${PENGUIN_ART}
EOF`;
      
    case 'funny':
      return generateCowsayScript(jokeText);
      
    case 'retro':
      return generateFigletScript(username);
      
    default: // clean theme
      return '# Clean theme - no header';
  }
}

/**
 * Generate cowsay-specific script
 */
function generateCowsayScript(jokeText: string): string {
  const installationInstructions = INSTALLATION_MESSAGES.cowsay.map(line => `echo "${line}"`).join('\n  ');
  const jokeDisplay = jokeText ? `echo "Programming Joke: ${jokeText.replace(/"/g, '\\"')}"` : '';
  
  return `# Cowsay Theme with Programming Joke
# Check if cowsay is installed
if ! command -v cowsay &> /dev/null; then
  ${installationInstructions}
  echo ""
  ${jokeText ? jokeDisplay : ''}
else
  if [ -n "${jokeText}" ]; then
    echo "Programming Joke:"
    cowsay "${jokeText.replace(/"/g, '\\"')}"
  else
    cowsay "Welcome to GitHub CLI"
  fi
fi`;
}

/**
 * Generate figlet-specific script
 */
function generateFigletScript(username: string): string {
  const installationInstructions = INSTALLATION_MESSAGES.figlet.map(line => `echo "${line}"`).join('\n  ');
  
  return `# Figlet Theme
# Check if figlet is installed
if ! command -v figlet &> /dev/null; then
  ${installationInstructions}
else
  figlet "${username}"
fi`;
}

// Define GitHub user data interface for type safety
interface GitHubUserData {
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  twitter_username?: string;
  // Add other potential properties we might use
  login: string;
  avatar_url?: string;
  html_url?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
  // Allow for additional properties without using 'any'
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Extract focused user information (role, socials, intro) from GitHub data
 */
function extractUserInfo(userData: GitHubUserData): string {
  const lines = [];
  
  // Create intro paragraph with name and intro text
  const namePart = userData.name ? userData.name : userData.login;
  let introParagraph = `I am ${namePart}, `;
  
  // Add bio if available
  if (userData.bio) {
    introParagraph += `${userData.bio.replace(/"/g, '\\"')}`;
  } else {
    // Default intro if nothing else available
    introParagraph += `a developer on GitHub.`;
  }
  
  // Add the intro paragraph
  lines.push(`echo "${introParagraph}"`);
  lines.push(`echo ""`);
  
  // Add work/role in a structured format with background color
  if (userData.company) {
    const company = userData.company.replace(/"/g, '\\"').replace(/^@/, '');
    lines.push(`echo -e "${TERMINAL_STYLES.BG_GRAY}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}Work${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}${company}"`);
  }
  
  // Add location in a structured format with background color
  if (userData.location) {
    lines.push(`echo -e "${TERMINAL_STYLES.BG_GRAY}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}Location${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}${userData.location.replace(/"/g, '\\"')}"`);
  }
  
  // Add social links in a structured format with background colors
  const socials = extractSocialsStructured(userData);
  lines.push(...socials);
  
  return lines.join('\n');
}

/**
 * Extract social links from GitHub profile data in a structured format with background colors
 */
function extractSocialsStructured(userData: GitHubUserData): string[] {
  const socials = [];
  
  // GitHub link
  socials.push(`echo -e "${TERMINAL_STYLES.BG_GRAY}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}GitHub${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}https://github.com/${userData.login}"`);
  
  // Twitter
  if (userData.twitter_username) {
    socials.push(`echo -e "${TERMINAL_STYLES.BG_BLUE}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}Twitter${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}https://twitter.com/${userData.twitter_username.replace(/"/g, '\\"')}"`);
  }
  
  // LinkedIn
  const linkedinMatch = userData.bio ? userData.bio.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i) : null;
  if (linkedinMatch) {
    socials.push(`echo -e "${TERMINAL_STYLES.BG_BLUE}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}LinkedIn${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}https://linkedin.com/in/${linkedinMatch[1].replace(/"/g, '\\"')}"`);
  }
  
  // YouTube
  const youtubeMatch = userData.bio ? userData.bio.match(/youtube\.com\/(user\/|channel\/|@)?([a-zA-Z0-9_-]+)/i) : null;
  if (youtubeMatch) {
    const handle = youtubeMatch[2];
    socials.push(`echo -e "${TERMINAL_STYLES.BG_RED}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}YouTube${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}https://youtube.com/${youtubeMatch[1] || ''}${handle.replace(/"/g, '\\"')}"`);
  }
  
  // Website/blog
  if (userData.blog) {
    socials.push(`echo -e "${TERMINAL_STYLES.BG_GREEN}${TERMINAL_STYLES.WHITE}${TERMINAL_STYLES.PAD}Web${TERMINAL_STYLES.PAD}${TERMINAL_STYLES.RESET}${TERMINAL_STYLES.PAD}${userData.blog.replace(/"/g, '\\"')}"`);
  }
  
  return socials;
}

/**
 * Generate complete bash script with color support
 */
function generateCompleteScript(themeScript: string, username: string, theme: ThemeType, userData: GitHubUserData): string {
  // Extract focused information
  const userInfo = extractUserInfo(userData);
  
  return `#!/bin/bash

# Define terminal colors
BG_GRAY='\\033[48;5;240m'
BG_BLUE='\\033[48;5;39m'
BG_GREEN='\\033[48;5;35m'
BG_RED='\\033[48;5;196m'
WHITE='\\033[97m'
RESET='\\033[0m'

${themeScript}
${userInfo}
echo -e "${TERMINAL_STYLES.RESET}Check out more at: https://github.com/${username}"

${theme === 'retro' ? 'echo -e "\\nGenerated with GitHub Profile CLI"' : ''}`;
}

/**
 * Upload script to hosting service
 */
async function uploadScriptToHost(scriptContent: string, username: string): Promise<string> {
  try {
    const tempDir = os.tmpdir();
    const tempFilePath = join(tempDir, `${username}-script.sh`);
    
    await writeFile(tempFilePath, scriptContent);
    
    const { stdout, stderr } = await execPromise(
      `curl -A "GitHub CLI v2.0.0" -F "file=@${tempFilePath}" https://0x0.st`
    );
    
    if (stderr) {
      console.error('Error from curl:', stderr);
    }
    
    return stdout ? stdout.trim() : '';
  } catch (error) {
    console.error('Error uploading to 0x0.st:', error);
    return '';
  }
}

function generateCommand(scriptContent: string, scriptUrl: string): string {
  return scriptUrl 
    ? `bash <(curl -s ${scriptUrl})`
    : `bash <(echo "${scriptContent.replace(/"/g, '\\"')}")`;
} 