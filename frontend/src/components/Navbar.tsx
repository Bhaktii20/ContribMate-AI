'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, GitPullRequest, LayoutDashboard, Sparkles, FolderGit2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Find Repositories', href: '/discover', icon: Compass },
    { name: 'My Workspace', href: '/workspace', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <GitPullRequest className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">ContribMate <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">AI</span></span>
            <span className="hidden text-[10px] text-slate-400 sm:block">Open Source Mentor</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800/80 text-emerald-400 border border-slate-700/50'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:from-indigo-500 hover:to-emerald-500 hover:shadow-indigo-500/20 active:scale-95"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Create Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
