# GitHub User Command Generator

A simple Next.js application that generates bash commands to fetch GitHub user information. It includes:

- A form to input a GitHub username
- Generates a bash command: `bash <(curl -s https://yourdomain.dev/whois/:username)`
- Shows a live preview of the generated bash script output
- Styled with Tailwind CSS using a terminal-like appearance

## Features

- React component with form input for GitHub usernames
- Backend API endpoint at `/api/whois/:username`
- Error handling for failed API requests
- Terminal-like UI with monospaced font and dark background

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd clime-app
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## API Usage

The application provides an API endpoint at `/api/whois/:username` that returns information about a GitHub user in the following format:

```json
{
  "username": "example-user",
  "scriptContent": "#!/bin/bash\necho \"Looking up GitHub info for user: example-user\"\n...",
  "command": "bash <(curl -s https://yourdomain.dev/whois/example-user)"
}
```

## Deployment

You can deploy this application to Vercel or any other Next.js hosting provider.

## License

This project is licensed under the MIT License.
