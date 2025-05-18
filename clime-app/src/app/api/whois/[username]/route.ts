import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

const execPromise = promisify(exec);

export async function GET(
  request: NextRequest,
  context: { params: { username: string } }
) {
  try {
    // Properly await params in async context
    const params = context.params;
    const username = params.username;
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // Fetch user data from GitHub API
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    
    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
    // Fetch user's readme if available
    let readmeContent = '';
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${username}/${username}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        // README content is base64 encoded
        const rawReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        readmeContent = processReadmeForBash(rawReadme);
      }
    } catch (error) {
      console.error('Error fetching readme:', error);
      // If readme fetch fails, we'll just continue without it
    }
    
    // Create a clean bash script with just the essential information
    const scriptContent = `#!/bin/bash

${readmeContent}
echo "Check out more at: https://github.com/${username}"
`;

    // Upload the script to 0x0.st using curl
    let scriptUrl = '';
    try {
      // Create temporary file path
      const tempDir = os.tmpdir();
      const tempFilePath = join(tempDir, `${username}-script.sh`);
      
      // Write script to temporary file
      await writeFile(tempFilePath, scriptContent);
      
      // Execute curl command with a proper user agent
      const { stdout, stderr } = await execPromise(
        `curl -A "GitHub CLI v2.0.0" -F "file=@${tempFilePath}" https://0x0.st`
      );
      
      if (stderr) {
        console.error('Error from curl:', stderr);
      }
      
      if (stdout) {
        scriptUrl = stdout.trim();
      }
    } catch (error) {
      console.error('Error uploading to 0x0.st:', error);
    }

    // If we couldn't get a script URL, provide a fallback mechanism
    const finalCommand = scriptUrl 
      ? `bash <(curl -s ${scriptUrl})`
      : `bash <(echo "${scriptContent.replace(/"/g, '\\"')}")`;

    return NextResponse.json({ 
      username,
      scriptContent,
      command: finalCommand,
      userData,
      scriptUrl: scriptUrl || ''
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * Process README markdown content into bash-friendly text
 */
function processReadmeForBash(markdown: string): string {
  // Remove HTML tags
  let processedText = markdown.replace(/<[^>]*>/g, '');
  
  // Remove Markdown images ![alt](url)
  processedText = processedText.replace(/!\[.*?\]\(.*?\)/g, '');
  
  // Remove Markdown links [text](url)
  processedText = processedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove empty links []()
  processedText = processedText.replace(/\[\]\([^)]*\)/g, '');
  
  // Remove badges and shields
  processedText = processedText.replace(/https?:\/\/img\.shields\.io[^\s)]+/g, '');
  processedText = processedText.replace(/https?:\/\/shields\.io[^\s)]+/g, '');
  processedText = processedText.replace(/https?:\/\/komarev\.com[^\s)]+/g, '');
  processedText = processedText.replace(/https?:\/\/github-readme-stats\.vercel\.app[^\s)]+/g, '');
  processedText = processedText.replace(/https?:\/\/streak-stats\.demolab\.com[^\s)]+/g, '');
  
  // Remove GitHub note blocks [!NOTE]
  processedText = processedText.replace(/>\s*\[!NOTE\].*$/gm, '');
  processedText = processedText.replace(/>\s*\[!TIP\].*$/gm, '');
  processedText = processedText.replace(/>\s*\[!IMPORTANT\].*$/gm, '');
  processedText = processedText.replace(/>\s*\[!WARNING\].*$/gm, '');
  processedText = processedText.replace(/>\s*\[!CAUTION\].*$/gm, '');
  
  // Remove markdown headers (#, ##, etc.)
  processedText = processedText.replace(/^#+\s+/gm, '');
  
  // Remove github emoji codes :emoji:
  processedText = processedText.replace(/:[a-zA-Z0-9_+-]+:/g, '');
  
  // Remove blockquotes
  processedText = processedText.replace(/^>\s+/gm, '');
  
  // Replace multiple blank lines with a single blank line
  processedText = processedText.replace(/\n{3,}/g, '\n\n');
  
  // Replace escaped quotes with single quotes
  processedText = processedText.replace(/\\"/g, "'");
  
  // Split into lines, process each line, and rejoin
  const lines = processedText.split('\n');
  
  const result = lines
    .map(line => {
      // Skip lines that are just markdown formatting or empty after processing
      const trimmed = line.trim();
      if (!trimmed || 
          trimmed === '---' || 
          trimmed === '```' || 
          trimmed.match(/^!\[/) || 
          trimmed === '\\' || 
          trimmed === '"\\' || 
          trimmed === '\"') {
        return '';
      }
      
      // Remove any remaining markdown syntax or URLs
      const cleanLine = trimmed
        .replace(/(?:\*\*|__)(.*?)(?:\*\*|__)/g, '$1') // Bold
        .replace(/(?:\*|_)(.*?)(?:\*|_)/g, '$1')       // Italic
        .replace(/`([^`]+)`/g, '$1')                   // Inline code
        .replace(/https?:\/\/\S+/g, '')                // URLs
        .replace(/^-\s+/, '')                          // List items without the dash
        .trim();
      
      // Only include non-empty lines after all processing
      if (cleanLine) {
        return `echo "${cleanLine.replace(/"/g, '\\"')}"`;
      }
      return '';
    })
    .filter(line => line) // Remove empty lines
    .join('\n');
  
  return result;
} 