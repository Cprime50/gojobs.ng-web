import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedJobs, setCachedJobs } from '../../utils/cache';
import { Job, RawJobData } from '../../types/job';

// Server-side environment variables (not exposed to the client)
const API_URL = process.env.API_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const API_KEY = process.env.API_KEY?.replace(/"/g, ''); // Remove quotes if present

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if we have cached data first
    const cachedResult = getCachedJobs(false);
    
    if (cachedResult.jobs && !cachedResult.expired) {
      return res.status(200).json({ data: cachedResult.jobs });
    }
    
    // If no valid cache, fetch from external API
    if (!API_URL) {
      return res.status(500).json({ error: 'API_URL is not configured on the server' });
    }

    const response = await fetch(API_URL, {
      headers: {
        'Origin': ALLOWED_ORIGIN || '',
        'X-API-Key': API_KEY || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`External API returned status ${response.status}`);
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
    
    res.status(200).json({ data: processedJobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    // If fetch fails, return cached jobs (if any)
    const cachedResult = getCachedJobs(false);
    if (cachedResult.jobs) {
      return res.status(200).json({ data: cachedResult.jobs });
    }
    
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}