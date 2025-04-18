import { Job, RawJobData } from '../types/job';
import { getCachedJobs } from './cache';

// Internal API endpoint instead of direct external API access
const INTERNAL_API_ENDPOINT = '/api/jobs';

// Main function to fetch jobs from API/cache
export async function fetchJobsFromAPI(): Promise<Job[]> {
  try {
    console.log('Fetching jobs from server cache via API');
    const response = await fetch(INTERNAL_API_ENDPOINT, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    const jobs = responseData?.data && Array.isArray(responseData.data) 
      ? responseData.data 
      : [];
    
    console.log(`Retrieved ${jobs.length} jobs from server cache`);
    return jobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
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

// Clear cache function - only clears server-side JSON file
export function clearJobsCache(): Promise<boolean> {
  return new Promise((resolve) => {
    // Server-side only API call to clear cache
    fetch('/api/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clear: true }),
    })
    .then(response => {
      if (response.ok) {
        console.log('Server cache cleared via API');
        resolve(true);
      } else {
        console.error('Failed to clear server cache');
        resolve(false);
      }
    })
    .catch(error => {
      console.error('Error clearing cache:', error);
      resolve(false);
    });
  });
}