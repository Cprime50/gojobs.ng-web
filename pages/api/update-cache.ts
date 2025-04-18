import type { NextApiRequest, NextApiResponse } from 'next';
import { setCachedJobs } from '../../utils/cache';
import { Job } from '../../types/job';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for a secret to prevent unauthorized cache updates
  const { jobs, secret } = req.body;
  
  // Security check
  const validSecret = process.env.CACHE_SECRET || ''; // This must be set in .env
  if (!validSecret || secret !== validSecret) {
    console.error('Invalid or missing secret for cache update');
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    // Validate jobs data
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Invalid jobs data' });
    }
    
    // Process and validate each job to ensure data integrity
    const validatedJobs: Job[] = jobs.map(job => ({
      ...job,
      // Ensure required fields exist
      id: job.id || '',
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      job_type: job.job_type || '',
      tags: job.tags || []
    }));
    
    // Update the cache with validated jobs
    setCachedJobs(validatedJobs);
    
    console.log(`Cache updated via API with ${validatedJobs.length} jobs at ${new Date().toLocaleString()}`);
    
    return res.status(200).json({ 
      success: true, 
      message: `Cache updated with ${validatedJobs.length} jobs`,
      count: validatedJobs.length
    });
  } catch (error) {
    console.error('Error updating cache:', error);
    return res.status(500).json({ error: 'Failed to update cache' });
  }
} 