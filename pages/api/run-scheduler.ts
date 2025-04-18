import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAndCacheJobs } from '../../utils/scheduler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Restrict to GET requests for simplicity
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authorization via a query parameter or header
  const { secret } = req.query;
  const validSecret = process.env.CACHE_SECRET || '';
  if (validSecret && secret !== validSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Manual trigger: Running scheduled job to update cache');
    
    // Run the cache update job (this runs server-side)
    await fetchAndCacheJobs();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cache update job completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running scheduled job:', error);
    return res.status(500).json({ error: 'Failed to run scheduled job' });
  }
} 