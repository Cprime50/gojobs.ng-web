import { fetchJobsFromAPI } from './api';
import { setCachedJobs, getCachedJobs } from './cache';

// Constants for scheduled times (Lagos time - UTC+1)
const LAGOS_TIMEZONE = 'Africa/Lagos';
const SCHEDULED_HOURS = [13, 21]; // 1pm and 9pm

/**
 * Get the time until the next scheduled fetch in milliseconds
 */
export function getTimeUntilNextFetch(): number {
  // Get current time in Lagos timezone
  const now = new Date();
  
  // Calculate the next scheduled time
  let nextFetchTime: Date | null = null;
  let minTimeUntilFetch = Infinity;
  
  // Check each scheduled hour
  for (const hour of SCHEDULED_HOURS) {
    // Create a date for today at the scheduled hour
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour, 0, 0, 0); // Set to exact hour (0 minutes, 0 seconds)
    
    // Calculate time difference in milliseconds
    let timeUntilFetch = scheduledTime.getTime() - now.getTime();
    
    // If the scheduled time has already passed today, schedule for tomorrow
    if (timeUntilFetch <= 0) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      timeUntilFetch = scheduledTime.getTime() - now.getTime();
    }
    
    // Update if this is sooner than the current next fetch time
    if (timeUntilFetch < minTimeUntilFetch) {
      minTimeUntilFetch = timeUntilFetch;
      nextFetchTime = scheduledTime;
    }
  }
  
  return minTimeUntilFetch;
}

/**
 * Initialize the background fetch scheduler
 */
export function initScheduler(): void {
  // Schedule the first fetch
  scheduleNextFetch();
  
  console.log('Job scheduler initialized');
}

/**
 * Fetch jobs directly from the API and update the cache
 * This is used by the scheduler to update the cache at scheduled times
 */
async function fetchAndCacheJobs(): Promise<void> {
  try {
    console.log('Scheduled job fetch: Fetching fresh data from API');
    
    // Make a direct API call to our server-side endpoint
    const response = await fetch('/api/fetch-jobs', {
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
      console.log(`Scheduled fetch: Retrieved ${freshJobs.length} jobs. Updating cache.`);
      
      // Get existing cached jobs to compare
      const { jobs: existingJobs } = getCachedJobs();
      
      // Only update cache if we have new data that's different
      if (!existingJobs || existingJobs.length !== freshJobs.length) {
        // Update the cache with new jobs
        setCachedJobs(freshJobs);
        console.log(`Cache updated with ${freshJobs.length} jobs at ${new Date().toLocaleString('en-NG', { timeZone: LAGOS_TIMEZONE })}`);
      } else {
        console.log('No changes detected in job data. Cache remains current.');
      }
    } else {
      console.log('No jobs returned from scheduled fetch');
    }
  } catch (error) {
    console.error('Error during scheduled job fetch:', error);
  }
}

/**
 * Schedule the next fetch at the appropriate time
 */
function scheduleNextFetch(): void {
  const timeUntilNextFetch = getTimeUntilNextFetch();
  const nextFetchDate = new Date(Date.now() + timeUntilNextFetch);
  
  console.log(`Next scheduled job fetch at: ${nextFetchDate.toLocaleString('en-NG', { timeZone: LAGOS_TIMEZONE })}`);
  
  // Schedule the next fetch
  setTimeout(() => {
    console.log(`Executing scheduled job fetch at: ${new Date().toLocaleString('en-NG', { timeZone: LAGOS_TIMEZONE })}`);
    
    // Perform the fetch and update cache
    fetchAndCacheJobs()
      .catch(error => {
        console.error('Error during scheduled fetch:', error);
      })
      .finally(() => {
        // Schedule the next fetch regardless of success/failure
        scheduleNextFetch();
      });
  }, timeUntilNextFetch);
}
