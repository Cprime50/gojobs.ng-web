import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '../components/ThemeProvider';
import { useEffect } from 'react';
import { initScheduler } from '../utils/scheduler';

export default function App({ Component, pageProps }: AppProps) {
  // Initialize the job scheduler on the client side only
  useEffect(() => {
    // Only run in browser environment, not during SSR
    if (typeof window !== 'undefined') {
      // Initialize the scheduler to fetch jobs at 1pm and 9pm Lagos time
      initScheduler();
    }
  }, []);

  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
} 