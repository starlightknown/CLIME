import GitHubUserForm from '@/components/GitHubUserForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            GitHub Profile CLI
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Generate a sharable bash command that showcases GitHub profiles in the terminal.
            Perfect for CLI enthusiasts and developers who love the command line.
          </p>
        </header>
        
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-cyan-500 to-purple-500">
            <div className="bg-gray-800 p-6">
              <div className="flex items-center mb-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 text-gray-400 font-mono text-sm">
                  ~/github-profile-cli
                </div>
              </div>
              
              <GitHubUserForm />
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-400">
          <p className="mb-2">Made with 💙 for terminal lovers</p>
          <div className="flex justify-center space-x-4">
            <a href="https://github.com" className="hover:text-white transition">GitHub</a>
            <a href="https://nextjs.org" className="hover:text-white transition">Next.js</a>
            <a href="https://tailwindcss.com" className="hover:text-white transition">Tailwind CSS</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
