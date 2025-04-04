import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Get environment variables for footer customization
const SITE_OWNER_NAME = process.env.NEXT_PUBLIC_SITE_OWNER_NAME;
const SITE_OWNER_BIO = process.env.NEXT_PUBLIC_SITE_OWNER_BIO;
const LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL;
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL;

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  updateFilter?: (filter: 'new' | 'remote') => void;
}

export default function Layout({ 
  children, 
  title = 'GoJobs.ng - Golang Jobs in Nigeria',
  description = 'Find the best Golang developer jobs in Nigeria',
  updateFilter
}: LayoutProps) {
  // Handle filter button clicks
  const handleFilterClick = (filter: 'new' | 'remote', e: React.MouseEvent) => {
    e.preventDefault();
    if (updateFilter) {
      updateFilter(filter);
    } else if (typeof window !== 'undefined' && (window as any).updateFilter) {
      // Fallback to global function if available
      (window as any).updateFilter(filter);
    } else {
      // Default behavior - update URL and let the page handle it on load
      window.location.href = filter === 'new' ? '/' : `/?filter=${filter}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/" className="flex items-center space-x-3">
            <img 
              src="/favicon.svg" 
              alt="GoJobs.ng Logo" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="font-mono text-xl font-semibold cursor-pointer hover:text-green-700 transition-colors">
                gojobs.ng
              </h1>
              <p className="text-sm text-muted-foreground italic">
                A curated list of Golang jobs in Nigeria.
              </p>
            </div>
          </a>
        </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border py-8 mt-8 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="font-mono text-xl font-semibold mb-4">gojobs.ng</h2>
              <p className="text-base text-muted-foreground mb-4">
                {SITE_OWNER_BIO}
              </p>
              <div className="flex gap-4">
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-700">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-700">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Browse Jobs</h3>
              <ul className="grid gap-3">
                <li>
                  • <a href="/" onClick={(e) => handleFilterClick('new', e)} className="text-green-700 hover:underline cursor-pointer text-base">New Jobs</a>
                </li>
                <li>
                  • <a href="/?filter=remote" onClick={(e) => handleFilterClick('remote', e)} className="text-green-700 hover:underline cursor-pointer text-base">Remote Jobs</a>
                </li>
                <li>
                  • <Link href="/companies" className="text-green-700 hover:underline cursor-pointer text-base">See Companies</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <ul className="grid gap-3">
                <li>
                  • <span className="text-green-700 text-base">Created by {SITE_OWNER_NAME}</span>
                </li>
                <li>
                  • <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline text-base">View on GitHub</a>
                </li>
                <li>
                  • <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline text-base">Follow on LinkedIn</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
            <p>Content on this website is licensed under CC BY-SA 3.0.</p>
            <p className="mt-2"> {new Date().getFullYear()} gojobs.ng. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}