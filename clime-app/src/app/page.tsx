import GitHubUserForm from '@/components/GitHubUserForm';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">GitHub User Command Generator</h1>
        <p className="text-gray-600 text-center">
          Enter a GitHub username to generate a bash command that can be used to fetch user information.
        </p>
      </div>
      
      <div className="w-full">
        <GitHubUserForm />
      </div>
    </div>
  );
}
