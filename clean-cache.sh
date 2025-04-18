#!/bin/bash

# Go9jaJobs Cache Cleaning Script
# Removes non-English job listings from the cache

echo "Go9jaJobs Cache Cleaner"
echo "======================="
echo "Running cache cleaning script..."

# Run the script from the project root directory
cd "$(dirname "$0")"
node scripts/clean-cache.js

# Check the exit status
if [ $? -eq 0 ]; then
  echo "Cache cleaning completed successfully."
else
  echo "Cache cleaning failed. See errors above."
  exit 1
fi 