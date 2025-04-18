import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedJobs } from '../../utils/cache';
import { fetchAndCacheJobs } from '../../utils/scheduler';

// Track if the server-side scheduler has been initialized
let schedulerInitialized = false;
let schedulerIntervalId: NodeJS.Timeout | null = null;

// Function to run the job once when the server starts
const initServerSideJobFetch = async () => {
  if (schedulerInitialized) return;
  
  console.log('Initializing server-side job fetch');
  schedulerInitialized = true;
  
  // Fetch job data immediately on server start
  try {
    // Optional: Wait a short delay to make sure everything is loaded
    setTimeout(async () => {
      try {
        await fetchAndCacheJobs();
        console.log('Initial server-side cache update completed');
      } catch (initialFetchError) {
        console.error('Error during initial cache update:', initialFetchError);
      }
      
      // Set up recurring fetch based on SCHEDULED_JOB_TIME
      // This creates a simple scheduler that checks every minute
      // if it's time to run the job based on the configured time
      if (schedulerIntervalId) {
        clearInterval(schedulerIntervalId);
      }
      
      schedulerIntervalId = setInterval(async () => {
        try {
          // Get current time
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          
          // Parse scheduled time from env
          const scheduledTimeStr = process.env.SCHEDULED_JOB_TIME || '00:20';
          const [scheduledHour, scheduledMinute] = scheduledTimeStr.split(':').map(n => parseInt(n, 10));
          
          // Check if it's time to run the job (within a 1-minute window)
          if (hour === scheduledHour && minute === scheduledMinute) {
            console.log(`Scheduled time reached: ${scheduledHour}:${scheduledMinute} - Running job fetch`);
            
            try {
              await fetchAndCacheJobs();
              console.log('Scheduled cache update completed successfully');
            } catch (scheduledFetchError) {
              console.error('Error during scheduled cache update:', scheduledFetchError);
            }
          }
        } catch (error) {
          console.error('Error in scheduler interval:', error);
        }
      }, 60000); // Check every minute
      
      console.log(`Server-side scheduler active, will run at ${process.env.SCHEDULED_JOB_TIME || '00:20'}`);
    }, 5000);
  } catch (error) {
    console.error('Error initializing server-side job fetch:', error);
    // Reset the initialization flag so we can try again later
    schedulerInitialized = false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Initialize the server-side job fetcher on first API call
  initServerSideJobFetch().catch(err => {
    console.error('Failed to initialize scheduler:', err);
  });
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get cached data from JSON file
    const cachedResult = getCachedJobs();
    
    if (cachedResult.jobs && cachedResult.jobs.length > 0) {
      console.log(`Serving ${cachedResult.jobs.length} jobs from cache`);
      return res.status(200).json({ data: cachedResult.jobs });
    }
    
    // If no cache exists yet, start a fetch
    console.log('No cached jobs found, starting background fetch');
    // Fetch in the background without waiting for it to complete
    fetchAndCacheJobs().catch(err => console.error('Background fetch error:', err));
    // Return empty array for now
    return res.status(200).json({ data: [] });
  } catch (error) {
    console.error('Error retrieving cached jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
}