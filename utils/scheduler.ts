import { setCachedJobs } from './cache';

// Constants for timezone (Lagos time - UTC+1)
const LAGOS_TIMEZONE = 'Africa/Lagos';

// Get scheduled time from environment variables or use default (00:20)
const getScheduledTime = (): { hour: number; minute: number } => {
  try {
    // Format should be HH:MM (24-hour format)
    const scheduledTimeStr = process.env.SCHEDULED_JOB_TIME || '00:20';
    const [hourStr, minuteStr] = scheduledTimeStr.split(':');
    
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Validate values
    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
      console.warn(`Invalid SCHEDULED_JOB_TIME: ${scheduledTimeStr}, using default 00:20`);
      return { hour: 0, minute: 20 };
    }
    
    return { hour, minute };
  } catch (error) {
    console.warn('Error parsing SCHEDULED_JOB_TIME, using default 00:20', error);
    return { hour: 0, minute: 20 };
  }
};

/**
 * Get the time until the next scheduled fetch in milliseconds
 */
export function getTimeUntilNextFetch(): number {
  // Get current time
  const now = new Date();
  
  // Get scheduled time from environment variables
  const { hour, minute } = getScheduledTime();
  
  // Create a date for today at the scheduled time
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour, minute, 0, 0);
  
  // Calculate time difference in milliseconds
  let timeUntilFetch = scheduledTime.getTime() - now.getTime();
  
  // If the scheduled time has already passed today, schedule for tomorrow
  if (timeUntilFetch <= 0) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
    timeUntilFetch = scheduledTime.getTime() - now.getTime();
  }
  
  return timeUntilFetch;
}

/**
 * Initialize the background fetch scheduler
 */
export function initScheduler(): void {
  // Get the scheduled time for logging
  const { hour, minute } = getScheduledTime();
  console.log(`Job scheduler initialized to run at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} Lagos time`);
  
  // Schedule the first fetch
  scheduleNextFetch();
}

/**
 * Fetch jobs directly from the API and update the cache
 * This is used by the scheduler to update the cache at scheduled times
 */
export async function fetchAndCacheJobs(): Promise<void> {
  try {
    console.log('Scheduled job fetch: Fetching fresh data from API');
    
    let fetchUrl: string;
    
    // If running on client-side (browser)
    if (typeof window !== 'undefined') {
      // Get the base URL from the current window location
      const protocol = window.location.protocol;
      const host = window.location.host;
      fetchUrl = `${protocol}//${host}/api/fetch-jobs`;
    } 
    // If running on server-side
    else {
      // When running on server, we need to directly access the external API
      // since we can't route internally through our own API endpoints
      const API_URL = process.env.API_URL;
      
      if (!API_URL) {
        throw new Error('API_URL environment variable is not configured');
      }
      
      fetchUrl = API_URL;
      console.log(`Using server-side direct API URL: ${fetchUrl}`);
    }
    
    // Make the API call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Scheduled-Job': 'true'
    };
    
    // For server-side, add any required authentication
    if (typeof window === 'undefined') {
      const API_KEY = process.env.API_KEY?.replace(/"/g, '');
      if (API_KEY) {
        headers['X-API-Key'] = API_KEY;
      }
      
      const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
      if (ALLOWED_ORIGIN) {
        headers['Origin'] = ALLOWED_ORIGIN;
      }
      
      // Generate timestamp and signature if needed
      const timestamp = new Date().toISOString();
      headers['X-Timestamp'] = timestamp;
      
      // If crypto is needed for HMAC signatures
      if (API_KEY) {
        try {
          const crypto = require('crypto');
          const hmac = crypto.createHmac('sha256', API_KEY);
          hmac.update(timestamp);
          const signature = hmac.digest('hex');
          headers['X-Signature'] = signature;
        } catch (err) {
          console.error('Error generating signature:', err);
        }
      }
    }
    
    // Make the request with appropriate headers
    const response = await fetch(fetchUrl, {
      method: 'GET',
      cache: 'no-store',
      headers
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
      
      // Update the cache with new jobs (server-side only)
      if (typeof window === 'undefined') {
        setCachedJobs(freshJobs);
        console.log(`Cache updated with ${freshJobs.length} jobs at ${new Date().toLocaleString('en-NG', { timeZone: LAGOS_TIMEZONE })}`);
      } else {
        // If client-side, call a special API endpoint to update the cache
        const cacheUpdateResponse = await fetch('/api/update-cache', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            jobs: freshJobs,
            secret: process.env.NEXT_PUBLIC_CACHE_SECRET || ''
          }),
        });
        
        if (cacheUpdateResponse.ok) {
          console.log(`Server cache updated via API with ${freshJobs.length} jobs`);
        } else {
          console.error('Failed to update server cache via API');
        }
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
