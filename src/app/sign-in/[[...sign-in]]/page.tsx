import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Quest Core</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your professional development journey
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}