import Link from 'next/link';
import Image from 'next/image';
import { Job, RawJobData } from '../types/job';
import { MapPin, Building, Clock, ExternalLink } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  // Try to parse raw_data if it's a string
  let rawData: RawJobData | null = null;
  try {
    if (typeof job.raw_data === 'string' && job.raw_data) {
      rawData = JSON.parse(job.raw_data) as RawJobData;
    }
  } catch (error) {
    console.error(`Failed to parse raw_data for job ${job.id}:`, error);
  }
  
  // Format the posted date
  const postedDate = new Date(job.posted_at || job.date_gotten || new Date());
  const formattedDate = !isNaN(postedDate.getTime()) 
    ? postedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
      })
    : 'Date unavailable';
  
  // Check if job was posted within the last 3 days
  const isNew = !isNaN(postedDate.getTime()) && 
    (new Date().getTime() - postedDate.getTime()) < (3 * 24 * 60 * 60 * 1000);

  // Get salary display
  const salaryDisplay = job.salary ? job.salary : 'Salary not specified';
  
  // Extract tags from description or use empty array
  const tags = (job as any).tags && Array.isArray((job as any).tags) ? (job as any).tags : [];
  
  // Company logo with fallback to icon
  const CompanyLogo = () => {
    // Use company_logo URL from the API
    if (job.company_logo) {
      return (
        <div className="w-10 h-10 mr-2 flex-shrink-0 overflow-hidden rounded-full border border-border relative">
          <Image 
            src={job.company_logo} 
            alt={`${job.company} logo`} 
            width={48} 
            height={48} 
            className="object-contain bg-white"
            priority
            quality={95}
            onError={() => {
              // We'll use a simpler approach to handle image errors
              const imgElement = document.querySelector(`[alt="${job.company} logo"]`);
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
          <Building className="w-6 h-6 absolute inset-0 m-auto hidden fallback-icon" />
        </div>
      );
    }
    
    // Fallback to the Building icon
    return (
      <Building className="w-6 h-6 mr-2 flex-shrink-0" />
    );
  };
  
  // Company name with optional link
  const CompanyName = () => {
    if (job.company_url) {
      return (
        <div className="flex items-center">
          <CompanyLogo />
          <div className="inline-flex items-center">
            <Link 
              href={job.company_url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(job.company_url, '_blank', 'noopener,noreferrer');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-green-700 hover:underline"
            >
              {job.company}
              <ExternalLink className="w-3 h-3 ml-1 inline-block" />
            </Link>
          </div>
        </div>
      );
    }
    return (
      <p className="text-sm font-medium text-muted-foreground flex items-center">
        <CompanyLogo />
        {job.company}
      </p>
    );
  };
  
  return (
    <div 
      className="bg-card border border-border rounded-lg hover:shadow-md transition-shadow duration-300 overflow-hidden h-full"
      onClick={onClick}
    >
      <div className={`p-4 ${onClick ? 'cursor-pointer' : ''} flex flex-col h-full`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-base text-foreground">{job.title}</h3>
            <div className="mt-1">
              <CompanyName />
            </div>
          </div>
          {job.salary && (
            <div className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">{salaryDisplay}</div>
          )}
          </div>
          
        <div className="flex items-center text-sm font-medium text-muted-foreground mt-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{job.location || 'Location not specified'}</span>
            {job.is_remote && (
            <span className="ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded text-sm font-semibold">
              Remote
              </span>
          )}
        </div>
        
        {isNew && (
          <div className="mt-2">
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-sm rounded-full font-semibold">
              NEW
            </span>
          </div>
        )}
        
        <div className="mt-2 flex flex-wrap gap-1">
            {job.job_type && (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                {job.job_type}
              </span>
            )}
            
          {tags.length > 0 && 
            tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="px-2 py-0.5 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                {tag}
              </span>
            ))
          }
        </div>
        
        <div className="mt-3 flex items-center text-sm font-medium text-muted-foreground">
          <Clock className="w-4 h-4 mr-1" />
          <span>Posted {formattedDate}</span>
          </div>
          
        {!onClick && job.url && (
          <div className="mt-3">
            <Link 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-green-700 hover:underline text-sm font-medium"
            >
              Apply for this position <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
        </div>
    </div>
  );
}