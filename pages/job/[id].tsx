import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Job } from '../../types/job';
import { GetServerSideProps } from 'next';
import { fetchJobsFromAPI } from '../../utils/api';
import { formatJobDescription } from '../../utils/formatJobDescription';

interface JobDetailsProps {
  job: Job | null;
}

export const getServerSideProps: GetServerSideProps<JobDetailsProps> = async (context) => {
  const { id } = context.params || {};
  
  if (!id || typeof id !== 'string') {
    return {
      props: {
        job: null
      }
    };
  }
  
  try {
    const allJobs = await fetchJobsFromAPI();
    const job = allJobs.find(job => job.job_id === id) || null;
    
    return {
      props: {
        job
      }
    };
  } catch (error) {
    console.error('Error fetching job details:', error);
    return {
      props: {
        job: null
      }
    };
  }
};

export default function JobDetails({ job }: JobDetailsProps) {
  const router = useRouter();
  
  // Try to parse raw_data if it's a string
  let rawData = null;
  if (job && typeof job.raw_data === 'string' && job.raw_data) {
    try {
      rawData = JSON.parse(job.raw_data);
    } catch (error) {
      console.error(`Failed to parse raw_data for job ${job.id}:`, error);
    }
  }
  
  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Job Not Found</h1>
          <p className="mt-2 text-gray-600">The job you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <div className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Back to job listings
            </div>
          </Link>
        </div>
      </div>
    );
  }
  
  // Format dates
  const postedDate = new Date(job.posted_at);
  const formattedPostedDate = !isNaN(postedDate.getTime())
    ? postedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unavailable';
    
  const expDate = new Date(job.exp_date);
  const formattedExpDate = !isNaN(expDate.getTime())
    ? expDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
      })
    : 'Not specified';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{job.title} | Golang Job Board</title>
        <meta name="description" content={`${job.title} at ${job.company} - ${job.location}`} />
      </Head>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-blue-600 text-2xl font-bold">dev<span className="text-blue-900">jobs</span></span>
              </div>
            </Link>
            <div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                NEWSLETTER
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <Link href="/">
            <div className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to job listings
            </div>
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <div className="mt-2 flex items-center">
                    {job.company_url && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${job.company_url}&sz=32`}
                        alt={`${job.company} logo`}
                        className="h-6 w-6 mr-2"
                      />
                    )}
                    <span className="text-gray-700 font-medium">{job.company}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-500">{job.location || 'Remote'}</span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.is_remote && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Full Remote
                      </span>
                    )}
                    
                    {job.job_type && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {job.job_type}
                      </span>
                    )}
                    
                    {job.salary && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {job.salary}
                      </span>
                    )}
                    
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Posted on {formattedPostedDate}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
              
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
                <div className="mt-3 prose prose-blue max-w-none bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  {job.description ? (
                    <div className="job-description">
                      {formatJobDescription(job.description)}
                    </div>
                  ) : (
                    <p>No description available for this job.</p>
                  )}
                </div>
              </div>
              
              {rawData && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(rawData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="mt-8 border-t pt-8">
                <h2 className="text-lg font-semibold text-gray-900">About {job.company}</h2>
                <p className="mt-2 text-gray-600">
                  {job.company} is based in {job.location || 'Remote'}.
                  {job.company_url && (
                    <> Visit their <a href={job.company_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">website</a> for more information.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-blue-600 text-white py-4 text-center mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <a href="#" className="hover:text-blue-200">
              Search all dev jobs →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}