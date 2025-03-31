import { Job, RawJobData } from '../types/job';
import { POLL_INTERVAL, getCachedJobs, setCachedJobs } from './cache';

// Use environment variables for configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Track if we're currently fetching to avoid duplicate requests
let isCurrentlyFetching = false;
let lastFetchAttempt = 0;

// Main function to fetch and cache jobs
export async function fetchJobsFromAPI(forceRefresh: boolean = false): Promise<Job[]> {
  // Check existing cache
  const cachedResult = getCachedJobs(forceRefresh);
  
  // If cached jobs exist and not expired, return them immediately
  if (cachedResult.jobs && !cachedResult.expired) {
    console.log('Using cached jobs (cache not expired)');
    return cachedResult.jobs;
  }
  
  // If we have cached jobs but it's a page refresh (not a forced refresh),
  // return cached jobs first, then update in background
  if (cachedResult.jobs && !forceRefresh) {
    // Update in background if not already fetching and if it's been at least 1 minute since last attempt
    const now = Date.now();
    if (!isCurrentlyFetching && (now - lastFetchAttempt > 60000)) {
      refreshCacheInBackground();
    }
    
    console.log('Using cached jobs while refreshing in background');
    return cachedResult.jobs;
  }
  
  // If we're already fetching, don't start another fetch
  if (isCurrentlyFetching) {
    console.log('Fetch already in progress, returning cached jobs if available');
    return cachedResult.jobs || [];
  }
  
  if (!API_URL) {
    throw new Error("API_URL is not defined. Check your environment variables.");
  }

  // Fetch fresh data from API
  try {
    isCurrentlyFetching = true;
    lastFetchAttempt = Date.now();
    
    console.log(`Fetching fresh jobs from ${API_URL}`);
    const response = await fetch(API_URL, {
      headers: {
        'Origin': ALLOWED_ORIGIN,
        'X-API-Key': API_KEY
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    const freshJobs = responseData?.data && Array.isArray(responseData.data) 
      ? responseData.data 
      : [];
    
    // Process jobs 
    const processedJobs = freshJobs.map((job: Job) => {
      // Create a processed job object
      const processedJob: Job = {
        ...job,
        tags: job.tags || []
      };
      
      // Parse raw_data if needed
      if (typeof job.raw_data === 'string' && job.raw_data) {
        try {
          const rawDataObj = JSON.parse(job.raw_data) as RawJobData;
          
          // If company_logo is not in the main object but in the raw_data, use it
          if (!processedJob.company_logo && rawDataObj.company_logo) {
            processedJob.company_logo = rawDataObj.company_logo;
          }
          
          return {
            ...processedJob,
            rawDataParsed: rawDataObj
          };
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      return processedJob;
    });
    
    // Cache the processed jobs
    setCachedJobs(processedJobs);
    
    console.log(`Fetched ${processedJobs.length} fresh jobs at ${new Date().toLocaleString()}`);
    return processedJobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    // If fetch fails, return cached jobs (if any)
    return cachedResult.jobs || [];
  } finally {
    isCurrentlyFetching = false;
  }
}

// Refresh cache in background without blocking UI
async function refreshCacheInBackground(): Promise<void> {
  // Don't do anything if already fetching
  if (isCurrentlyFetching) return;
  
  try {
    isCurrentlyFetching = true;
    lastFetchAttempt = Date.now();
    
    console.log('Refreshing cache in background...');
    const response = await fetch(API_URL, {
      headers: {
        'Origin': ALLOWED_ORIGIN,
        'X-API-Key': API_KEY
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    const freshJobs = responseData?.data && Array.isArray(responseData.data) 
      ? responseData.data 
      : [];
    
    if (freshJobs.length > 0) {
      // Process jobs 
      const processedJobs = freshJobs.map((job: Job) => {
        // Create a processed job object
        const processedJob: Job = {
          ...job,
          tags: job.tags || []
        };
        
        // Parse raw_data if needed
        if (typeof job.raw_data === 'string' && job.raw_data) {
          try {
            const rawDataObj = JSON.parse(job.raw_data) as RawJobData;
            
            // If company_logo is not in the main object but in the raw_data, use it
            if (!processedJob.company_logo && rawDataObj.company_logo) {
              processedJob.company_logo = rawDataObj.company_logo;
            }
            
            return {
              ...processedJob,
              rawDataParsed: rawDataObj
            };
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        return processedJob;
      });
      
      // Cache the processed jobs
      setCachedJobs(processedJobs);
      console.log(`Updated cache with ${processedJobs.length} jobs in background`);
    } else {
      console.log('No jobs returned from background refresh');
    }
  } catch (error) {
    console.error('Error in background refresh:', error);
  } finally {
    isCurrentlyFetching = false;
  }
}

// Helper function to filter jobs
export function filterJobs(jobs: Job[], filters: { jobType?: string; location?: string }): Job[] {
  if (!jobs || !Array.isArray(jobs)) {
    return [];
  }
  
  if (!filters.jobType && !filters.location) {
    return jobs;
  }
  
  return jobs.filter(job => {
    const matchesJobType = !filters.jobType || job.job_type === filters.jobType;
    const matchesLocation = !filters.location || job.location === filters.location;
    return matchesJobType && matchesLocation;
  });
}

// Clear cache function - fixed to avoid recursive calls
export function clearJobsCache(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('jobCache');
      console.log('Cache cleared');
      // Explicitly NOT calling fetchJobsFromAPI here to avoid recursion
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
}

// Export for use in components
export { refreshCacheInBackground };