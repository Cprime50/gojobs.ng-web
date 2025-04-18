import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../components/Layout';
import { Job } from '../../types/job';
import { fetchJobsFromAPI } from '../../utils/api';

interface CompanyData {
  name: string;
  logo: string;
  jobCount: number;
}

interface CompaniesPageProps {
  initialCompanies: CompanyData[];
}

export default function CompaniesPage({ initialCompanies }: CompaniesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<CompanyData[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  
  // Load companies from cached data on client-side
  useEffect(() => {
    const loadCompaniesFromCache = async () => {
      try {
        setLoading(true);
        // Use the existing fetchJobsFromAPI function which handles caching
        const jobs = await fetchJobsFromAPI();
        
        if (jobs && jobs.length > 0) {
          // Process companies data
          const companiesMap = new Map<string, CompanyData>();
          
          jobs.forEach(job => {
            if (!job.company) return;
            
            const companyName = job.company;
            
            if (companiesMap.has(companyName)) {
              // Increment job count for existing company
              const companyData = companiesMap.get(companyName)!;
              companyData.jobCount += 1;
              
              // Update logo if current job has one and the company doesn't
              if (!companyData.logo && job.company_logo) {
                companyData.logo = job.company_logo;
              }
            } else {
              // Add new company
              companiesMap.set(companyName, {
                name: companyName,
                logo: job.company_logo || '',
                jobCount: 1
              });
            }
          });
          
          // Convert Map to array and sort by job count (descending)
          const companiesArray = Array.from(companiesMap.values())
            .sort((a, b) => b.jobCount - a.jobCount);
          
          setCompanies(companiesArray);
        }
      } catch (error) {
        console.error('Error loading companies from cache:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompaniesFromCache();
  }, []);
  
  const filteredCompanies = searchTerm 
    ? companies.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : companies;

  return (
    <Layout 
      title="Companies - GoJobs.ng" 
      description="Browse companies with Golang job openings in Nigeria"
    >
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Companies Hiring Golang Developers</h1>
        
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full p-3 border border-border rounded-md bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-700 border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No companies found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link 
                href={`/?company=${encodeURIComponent(company.name)}`}
                key={company.name}
                className="block p-6 border border-border rounded-lg hover:border-green-600 transition-colors bg-card"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 relative flex-shrink-0 bg-muted rounded-md overflow-hidden">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={`${company.name} logo`}
                        fill
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {company.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{company.name}</h2>
                    <p className="text-green-700">
                      {company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'} available
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // This will be replaced by client-side data fetching from cache
    return {
      props: {
        initialCompanies: [],
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialCompanies: [],
      },
    };
  }
};
