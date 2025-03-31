export interface Job {
    id: string;
    job_id: string;
    title: string;
    company: string;
    company_url: string;
    company_logo?: string;
    country: string;
    state: string;
    description: string;
    url: string;
    source: string;
    is_remote: boolean;
    employment_type: string;
    posted_at: string;
    date_gotten: string;
    exp_date: string;
    salary: string;
    location: string;
    job_type: string;
    raw_data: string;
    tags?: string[];
  }
  
export interface RawJobData {
  company: string;
  company_url: string;
  company_logo?: string;
  description: string;
  id: string;
  is_remote: boolean;
  job_id: string;
  job_type: string;
  location: string;
  posted_at: string;
  salary: string;
  source: string;
  title: string;
  url: string;
  tags?: string[];
}
  