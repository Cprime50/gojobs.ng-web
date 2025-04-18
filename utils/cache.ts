import { Job } from '../types/job';

// Cache structure
interface CacheData {
  jobs: Job[];
  lastFetchTime: number;
}

// Get cached jobs - server side JSON file only
export function getCachedJobs(): { jobs: Job[] | null } {
  // Server-side caching
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');
      
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const cacheData: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
        console.log(`Server cache: last fetch ${new Date(cacheData.lastFetchTime).toLocaleString()}`);
        return { jobs: cacheData.jobs };
      }
    } catch (error) {
      console.error('Error reading cache file:', error);
    }
    return { jobs: null };
  }
  
  // For client-side, we'll use the API to get cached data
  return { jobs: null };
}

// Set cached jobs - only server-side JSON file
export function setCachedJobs(jobs: Job[]): void {
  if (!jobs || !Array.isArray(jobs)) {
    console.error('Attempted to cache invalid jobs data:', jobs);
    return;
  }
  
  // Only allow server-side caching
  if (typeof window === 'undefined') {
    try {
      const cacheData: CacheData = {
        jobs,
        lastFetchTime: Date.now()
      };
      
      const fs = require('fs');
      const path = require('path');
      const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');
      
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));
      console.log(`Server cache updated with ${jobs.length} jobs at ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('Error writing cache file:', error);
    }
  }
}