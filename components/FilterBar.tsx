import { ChangeEvent } from 'react';

interface FilterBarProps {
  jobType: string;
  setJobType: (type: string) => void;
  location: string;
  setLocation: (location: string) => void;
  locations: string[];
  jobTypes: string[];
}

export default function FilterBar({ 
  jobType, 
  setJobType, 
  location, 
  setLocation, 
  locations, 
  jobTypes 
}: FilterBarProps) {
  const handleJobTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setJobType(e.target.value);
  };
  
  const handleLocationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value);
  };
  
  // Ensure the currently selected location is in the list
  const allLocations = location && !locations.includes(location) 
    ? [...locations, location] 
    : locations;
    
  // Ensure the currently selected job type is in the list
  const allJobTypes = jobType && !jobTypes.includes(jobType)
    ? [...jobTypes, jobType]
    : jobTypes;
  
  return (
    <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="job-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Type
          </label>
          <select
            id="job-type"
            value={jobType}
            onChange={handleJobTypeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Job Types</option>
            {allJobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <select
            id="location"
            value={location}
            onChange={handleLocationChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Locations</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}