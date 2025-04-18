import React, { useState } from 'react';
import Layout from '../../components/Layout';

export default function TestScheduler() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  
  const runScheduler = async () => {
    setLoading(true);
    setStatus('Triggering scheduler...');
    
    try {
      const response = await fetch(`/api/run-scheduler?secret=${encodeURIComponent(secret)}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Success: ${data.message} at ${new Date(data.timestamp).toLocaleTimeString()}`);
      } else {
        setStatus(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error triggering scheduler:', error);
      setStatus(`Failed to trigger scheduler: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Test Scheduler</h1>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            This page allows you to test the job scheduler by manually triggering a cache update.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Cache Secret
              <input 
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter the cache secret from .env"
              />
            </label>
          </div>
          
          <button
            onClick={runScheduler}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Trigger Job Fetch'}
          </button>
        </div>
        
        {status && (
          <div className={`p-3 rounded-md ${status.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {status}
          </div>
        )}
        
        <div className="mt-6 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Environment Status</h2>
          <p>Scheduled Time: {process.env.NEXT_PUBLIC_SCHEDULED_JOB_TIME || '00:20 (default)'}</p>
          <p>Current Server Time: {new Date().toLocaleString()}</p>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">How It Works</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>The system automatically runs the job scheduler at the time specified in SCHEDULED_JOB_TIME (in .env)</li>
            <li>The scheduler fetches jobs from the external API and updates the server-side cache</li>
            <li>All client requests use this cached data to avoid excessive API calls</li>
            <li>You can manually trigger a cache update using this page</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
} 