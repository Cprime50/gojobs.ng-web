import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { filterNonEnglishJobs } from '../../utils/languageFilter';

// Server-side environment variables (not exposed to the client)
const API_URL = process.env.API_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const API_KEY = process.env.API_KEY?.replace(/"/g, ''); // Remove quotes if present

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_URL) {
    console.error('API_URL environment variable is not configured');
    return res.status(500).json({ error: 'API_URL is not configured on the server' });
  }

  if (!API_KEY) {
    console.error('API_KEY environment variable is not configured');
    return res.status(500).json({ error: 'API_KEY is not configured on the server' });
  }

  // Log the API configuration (without sensitive values)
  console.log(`Attempting to fetch data from: ${API_URL}`);
  console.log(`Origin header is ${ALLOWED_ORIGIN ? 'set' : 'not set'}`);
  console.log(`API Key is ${API_KEY ? 'set' : 'not set'}`);

  try {
    // Generate timestamp in RFC3339 format
    const timestamp = new Date().toISOString();
    
    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', API_KEY);
    hmac.update(timestamp);
    const signature = hmac.digest('hex');

    // Set up headers with correct API key format and HMAC signature
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Timestamp': timestamp,
      'X-Signature': signature
    };
    
    // Add Origin if available
    if (ALLOWED_ORIGIN) {
      headers['Origin'] = ALLOWED_ORIGIN;
    }

    // Fetch data from the external API
    const response = await fetch(API_URL, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text available');
      console.error(`API Error (${response.status}): ${errorText}`);
      
      if (response.status === 401) {
        console.error('Authentication error: Check that your API key, timestamp, or HMAC signature is correct');
      } else if (response.status === 403) {
        console.error('Authorization error: Check that your Origin header is allowed');
      }
      
      throw new Error(`External API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out non-English jobs if we have job data
    if (data && data.data && Array.isArray(data.data)) {
      const originalCount = data.data.length;
      data.data = filterNonEnglishJobs(data.data);
      
      const filteredCount = originalCount - data.data.length;
      if (filteredCount > 0) {
        console.log(`Filtered out ${filteredCount} non-English jobs from API response`);
      }
    }
    
    // Return the filtered data to the client
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching jobs from external API:', error);
    res.status(500).json({ error: 'Failed to fetch jobs from external API' });
  }
}
