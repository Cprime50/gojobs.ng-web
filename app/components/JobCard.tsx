<div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 text-sm">
  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{job.title}</h2>
  <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
  <p className="text-gray-500 dark:text-gray-300">{job.location}</p>
  <div className="mt-2 flex items-center space-x-2">
    {job.tags.map(tag => (
      <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
        {tag}
      </span>
    ))}
  </div>
</div> 