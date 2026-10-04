import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContribMate AI — Find your first meaningful open-source contribution',
  description: 'AI-powered open-source contribution mentor. Understand repositories, discover suitable issues, analyze difficulty, and get step-by-step contribution plans.',
  keywords: ['Open Source', 'GitHub', 'AI Mentor', 'First Contribution', 'Good First Issue', 'Developer Productivity']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
