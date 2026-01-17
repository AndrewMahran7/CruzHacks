import { ReactNode } from 'react';
import Link from 'next/link';

export default function AppLayout({ children }: { children: ReactNode }) {
  // TODO: Add real auth checks here - redirect to /login if not authenticated
  // e.g., use Supabase client to check session

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link href="/app" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Relay It</h1>
            </Link>

            {/* User Menu Placeholder */}
            <div className="flex items-center gap-4">
              {/* TODO: Add real user menu with avatar, dropdown, logout */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                <span className="text-sm text-gray-700">User</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
