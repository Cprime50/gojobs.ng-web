import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for this action
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');
    
    // Check if cache file exists
    if (fs.existsSync(CACHE_FILE_PATH)) {
      // Delete the cache file
      fs.unlinkSync(CACHE_FILE_PATH);
      console.log('Server cache file deleted successfully');
      return res.status(200).json({ success: true, message: 'Cache cleared' });
    } else {
      console.log('No cache file found to clear');
      return res.status(200).json({ success: true, message: 'No cache found to clear' });
    }
  } catch (error) {
    console.error('Error clearing cache file:', error);
    return res.status(500).json({ error: 'Failed to clear cache' });
  }
} 