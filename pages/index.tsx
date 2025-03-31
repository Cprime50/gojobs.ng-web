"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { fetchJobsFromAPI } from '../utils/api'
import { Job } from '../types/job'
import Layout from '../components/Layout'
import JobCard from '../components/JobCard'
import { Filter, ListFilter, Briefcase, MapPin, Building, Clock, ExternalLink } from 'lucide-react'
import React from "react"
import { formatJobDescription } from '../utils/formatJobDescription'

// Extend Window interface to allow our custom property
declare global {
  interface Window {
    __refreshTimerSet?: boolean;
    updateFilter?: (filter: 'new' | 'remote') => void;
  }
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [locationFilter, setLocationFilter] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("")
  const [activeFilter, setActiveFilter] = useState<'new' | 'remote'>('new')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(10) // Changed to show only 10 jobs initially

  // Helper functions for data management
  const extractUniqueValues = (data: Job[], key: keyof Job): string[] => {
    const values = data
      .map(job => job[key])
      .filter(Boolean) as string[];
    
    return [...new Set(values)].sort();
  };

  // Apply filters to job data
  const applyFilters = (data: Job[]): Job[] => {
    return data.filter(job => {
      const matchesLocation = locationFilter ? job.location === locationFilter : true;
      const matchesJobType = jobTypeFilter ? job.job_type === jobTypeFilter : true;
      const matchesRemote = activeFilter === 'remote' ? job.is_remote : true;
      
      return matchesLocation && matchesJobType && (activeFilter === 'remote' ? matchesRemote : true);
    });
  };

  // Sort jobs based on active filter
  const sortJobs = (data: Job[]): Job[] => {
    return [...data].sort((a, b) => {
      // Sort by date for 'new' filter
      return new Date(b.posted_at || b.date_gotten || 0).getTime() - 
             new Date(a.posted_at || a.date_gotten || 0).getTime();
    });
  };

  // Update URL with current filters
  const updateUrlWithFilters = () => {
    const url = new URL(window.location.href);
    
    // Clear existing parameters
    url.searchParams.delete('filter');
    url.searchParams.delete('location');
    url.searchParams.delete('jobType');
    
    // Add new parameters if they have values
    if (activeFilter !== 'new') {
      url.searchParams.set('filter', activeFilter);
    }
    
    if (locationFilter) {
      url.searchParams.set('location', locationFilter);
    }
    
    if (jobTypeFilter) {
      url.searchParams.set('jobType', jobTypeFilter);
    }
    
    // Update the URL without reloading the page
    window.history.pushState({}, '', url);
  };

  // Fetch jobs data
  const fetchJobs = async (forceRefresh: boolean = false) => {
    try {
      // Only show loading spinner on initial load when we don't have data
      if (jobs.length === 0) {
        setLoading(true);
      }
      setError(null);
      
      // Log but don't spam the console
      if (forceRefresh) {
        console.log('Attempting to force refresh jobs data');
      }
      
      const startTime = Date.now();
      const data = await fetchJobsFromAPI(forceRefresh);
      const fetchDuration = Date.now() - startTime;
      
      // If fetch was fast, we likely used the cache
      setIsUsingCache(fetchDuration < 100);
      
      // Only update state if we got data to avoid unnecessary re-renders
      if (data && data.length > 0) {
        // Check if the data has actually changed before updating state
        const dataChanged = jobs.length === 0 || JSON.stringify(data) !== JSON.stringify(jobs);
        
        if (dataChanged) {
          console.log(`Setting ${data.length} jobs in state${isUsingCache ? ' (from cache)' : ''}`);
          setJobs(data);
          setLastRefreshed(new Date());
        } else {
          console.log('Job data unchanged, avoiding re-render');
        }
      } else if (data && data.length === 0) {
        console.log('No jobs returned from API');
      }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again.');
      } finally {
        setLoading(false);
    }
  };

  // Initial data fetch - use a ref to prevent multiple calls
  const initialFetchDone = React.useRef(false);
  
  useEffect(() => {
    // Skip if already fetched once
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    
    // Parse URL parameters on initial load
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // Get filter from URL
      const filterParam = params.get('filter') as 'new' | 'remote' | null;
      if (filterParam && ['new', 'remote'].includes(filterParam)) {
        setActiveFilter(filterParam);
      }
      
      // Get location from URL
      const locationParam = params.get('location');
      if (locationParam) {
        setLocationFilter(locationParam);
      }
      
      // Get job type from URL
      const jobTypeParam = params.get('jobType');
      if (jobTypeParam) {
        setJobTypeFilter(jobTypeParam);
      }
    }
    
    console.log('Performing initial data fetch');
    // Don't force refresh on initial load - use cache if it's valid
    fetchJobs(false);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      updateUrlWithFilters();
    }
  }, [activeFilter, locationFilter, jobTypeFilter]);

  // Extract unique locations and job types for filters
  const locations = extractUniqueValues(jobs, 'location');
  const jobTypes = extractUniqueValues(jobs, 'job_type');

  // Apply filters and sorting
  const filteredJobs = applyFilters(jobs);
  const sortedJobs = sortJobs(filteredJobs);
  // Get the current page of jobs
  const displayedJobs = sortedJobs.slice(0, displayLimit);
  const hasMoreJobs = sortedJobs.length > displayLimit;

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Date unavailable";
    const date = new Date(dateString);
    return !isNaN(date.getTime()) 
      ? date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : "Date unavailable";
  };

  // Modified to load 10 more jobs at a time
  const loadMoreJobs = () => {
    setDisplayLimit(prevLimit => prevLimit + 10);
  };

  // Update filter function to be called from other components (like footer)
  const updateFilter = (filter: 'new' | 'remote') => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update filter
    setActiveFilter(filter);
    
    // Reset selected job if any
    if (selectedJob) {
      setSelectedJob(null);
    }
  };

  // Make this function available globally for the footer links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).updateFilter = updateFilter;
    }

    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined') {
        delete (window as any).updateFilter;
      }
    };
  }, [selectedJob]); // Include selectedJob in dependencies
  
  return (
    <Layout updateFilter={updateFilter}>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Golang Jobs</h1>
            <p className="text-muted-foreground">
              Find the best Golang developer opportunities in Nigeria
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
            <h3 className="font-medium">Error Loading Jobs</h3>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          {/* Filters Sidebar - made sticky on desktop with min-height to avoid overflow issues */}
          <div className="md:sticky md:top-4 md:self-start bg-card border border-border rounded-lg p-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto">
            <h2 className="font-semibold text-base mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h2>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <ListFilter className="w-4 h-4 mr-1" />
                View
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  className={`px-3 py-2 text-sm rounded-md text-left flex items-center
                    ${activeFilter === 'new' 
                      ? 'bg-green-700 text-white' 
                      : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}
                  onClick={() => setActiveFilter('new')}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Newest Jobs
                </button>
                <button
                  className={`px-3 py-2 text-sm rounded-md text-left flex items-center
                    ${activeFilter === 'remote' 
                      ? 'bg-green-700 text-white' 
                      : 'hover:bg-green-100 dark:hover:bg-green-900/30'}`}
                  onClick={() => setActiveFilter('remote')}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Remote Jobs
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location
              </h3>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-md p-2 text-sm hover:border-green-700 focus:border-green-700 focus:ring-1 focus:ring-green-700 focus:outline-none"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                Job Type
              </h3>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-md p-2 text-sm hover:border-green-700 focus:border-green-700 focus:ring-1 focus:ring-green-700 focus:outline-none"
              >
                <option value="">All Types</option>
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {(locationFilter || jobTypeFilter) && (
              <button
                onClick={() => {
                  setLocationFilter('');
                  setJobTypeFilter('');
                }}
                className="w-full px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/40 rounded-md text-center text-green-800 dark:text-green-300"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Job Listings */}
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-700 border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading jobs...</p>
              </div>
            ) : selectedJob ? (
              <div>
                <button
                  className="mb-4 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-700 dark:text-green-300"
                  onClick={() => setSelectedJob(null)}
                >
                  ← Back to Job Listings
                </button>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="mb-4">
                    <h1 className="text-xl font-bold">{selectedJob.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-muted-foreground">
                      {selectedJob.company_url ? (
                        <div className="flex items-center">
                          {selectedJob.company_logo ? (
                            <div className="w-12 h-12 mr-2 flex-shrink-0 overflow-hidden rounded-full border border-border relative">
                              <Image 
                                src={selectedJob.company_logo} 
                                alt={`${selectedJob.company} logo`} 
                                width={56} 
                                height={56} 
                                className="object-contain bg-white"
                                priority
                                quality={95}
                                onError={() => {
                                  // We'll use a simpler approach to handle image errors
                                  const imgElement = document.querySelector(`[alt="${selectedJob.company} logo"]`);
                                  if (imgElement) {
                                    imgElement.classList.add('hidden');
                                    const parent = imgElement.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector('.fallback-icon');
                                      if (fallback) fallback.classList.remove('hidden');
                                    }
                                  }
                                }}
                              />
                              <Building className="w-7 h-7 absolute inset-0 m-auto hidden fallback-icon" />
                            </div>
                          ) : (
                            <Building className="w-7 h-7 mr-2" />
                          )}
                          <a 
                            href={selectedJob.company_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-base font-medium hover:text-green-700 hover:underline inline-flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {selectedJob.company}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      ) : (
                        <span className="flex items-center text-base font-medium">
                          {selectedJob.company_logo ? (
                            <div className="w-12 h-12 mr-2 flex-shrink-0 overflow-hidden rounded-full border border-border relative">
                              <Image 
                                src={selectedJob.company_logo} 
                                alt={`${selectedJob.company} logo-alt`} 
                                width={56} 
                                height={56} 
                                className="object-contain bg-white"
                                priority
                                quality={95}
                                onError={() => {
                                  // We'll use a simpler approach to handle image errors
                                  const imgElement = document.querySelector(`[alt="${selectedJob.company} logo-alt"]`);
                                  if (imgElement) {
                                    imgElement.classList.add('hidden');
                                    const parent = imgElement.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector('.fallback-icon');
                                      if (fallback) fallback.classList.remove('hidden');
                                    }
                                  }
                                }}
                              />
                              <Building className="w-7 h-7 absolute inset-0 m-auto hidden fallback-icon" />
                            </div>
                          ) : (
                            <Building className="w-7 h-7 mr-2" />
                          )}
                          {selectedJob.company}
                        </span>
                      )}
                      <span className="flex items-center text-base font-medium">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedJob.location || 'Location not specified'}
                      </span>
                      {selectedJob.is_remote && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded text-sm font-semibold">
                          Remote
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="border border-border rounded-md p-3">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-1">Salary</h3>
                      <p className="font-mono text-base font-medium">{selectedJob.salary || "Not specified"}</p>
                    </div>
                    <div className="border border-border rounded-md p-3">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-1">Job Type</h3>
                      <p className="text-base font-medium">{selectedJob.job_type || "Not specified"}</p>
                    </div>
                    <div className="border border-border rounded-md p-3">
                      <h3 className="text-xs font-semibold text-muted-foreground mb-1">Posted</h3>
                      <p className="text-base font-medium">{formatDate(selectedJob.posted_at || selectedJob.date_gotten)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h2 className="text-lg font-bold mb-3">Job Description</h2>
                    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed border border-border rounded-md p-4 bg-background">
                      {formatJobDescription(selectedJob.description)}
                    </div>
                  </div>
                  
                  <div>
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 font-medium text-sm"
                    >
                      Apply for this position
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">
                    {activeFilter === 'new' ? 'Newest Jobs' : 
                     activeFilter === 'remote' ? 'Remote Jobs' : 'All Jobs'}
                    {sortedJobs.length > 0 && <span className="ml-2 text-muted-foreground">({sortedJobs.length})</span>}
                  </h2>
                </div>

                {sortedJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-card border border-border rounded-lg p-4">
                    <p className="text-muted-foreground text-center text-sm">No jobs found matching your criteria.</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                      {displayedJobs.map((job) => (
                        <JobCard
                          key={job.id || job.job_id}
                          job={job}
                          onClick={() => setSelectedJob(job)}
                        />
                      ))}
                    </div>
                    
                    {hasMoreJobs && (
                      <div className="flex justify-center mt-6">
                        <button 
                          onClick={loadMoreJobs}
                          className="px-4 py-2 bg-green-700 text-white text-sm rounded-md hover:bg-green-800 font-medium flex items-center"
                        >
                          Load More Jobs 
                          <span className="ml-1 text-xs opacity-80">({displayedJobs.length} of {sortedJobs.length})</span>
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
          </div>
    </Layout>
  );
}
