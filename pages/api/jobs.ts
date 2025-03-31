import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchJobsFromAPI } from '../../utils/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const jobs = await fetchJobsFromAPI();
    res.status(200).json({ data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}