import { Job, RawJobData } from '../types/job';

// Polling interval: 13 hours in milliseconds
export const POLL_INTERVAL = 13 * 60 * 60 * 1000;

// Cache structure
interface CacheData {
  jobs: Job[];
  lastFetchTime: number;
}

// Get cached jobs - works on both client and server
export function getCachedJobs(forceRefresh: boolean = false): { jobs: Job[] | null; expired: boolean } {
  // Server-side caching
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');
      
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const cacheData: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
        const now = Date.now();
        const expired = forceRefresh || (now - cacheData.lastFetchTime > POLL_INTERVAL);
        
        console.log(`Server cache: last fetch ${new Date(cacheData.lastFetchTime).toLocaleString()}, expired: ${expired}`);
        return { jobs: cacheData.jobs, expired };
      }
    } catch (error) {
      console.error('Error reading cache file:', error);
    }
    return { jobs: null, expired: true };
  }
  
  // Client-side caching
  try {
    const cacheData = localStorage.getItem('jobCache');
    if (cacheData) {
      const parsedCache = JSON.parse(cacheData);
      const { jobs, lastFetchTime } = parsedCache;
      const now = Date.now();
      const expired = forceRefresh || (now - lastFetchTime > POLL_INTERVAL);
      
      console.log(`Client cache: last fetch ${new Date(lastFetchTime).toLocaleString()}, expired: ${expired}`);
      return { jobs, expired };
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  
  return { jobs: null, expired: true };
}

// Set cached jobs - works on both client and server
export function setCachedJobs(jobs: Job[]): void {
  if (!jobs || !Array.isArray(jobs)) {
    console.error('Attempted to cache invalid jobs data:', jobs);
    return;
  }
  
  const cacheData: CacheData = {
    jobs,
    lastFetchTime: Date.now()
  };
  
  // Server-side caching
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');
      
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));
      console.log(`Server cache updated with ${jobs.length} jobs at ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('Error writing cache file:', error);
    }
    return;
  }
  
  // Client-side caching
  try {
    localStorage.setItem('jobCache', JSON.stringify(cacheData));
    console.log(`Client cache updated with ${jobs.length} jobs at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}