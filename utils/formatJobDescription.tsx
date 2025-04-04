import React, { ReactNode } from 'react';
import DOMPurify from 'dompurify';
import * as cheerio from 'cheerio';

/**
 * Converts a plain-text job description into a structured, readable HTML format using Cheerio.
 *
 * @param description The raw job description text
 * @returns React elements representing the formatted description
 */
export function formatJobDescription(description: string): ReactNode[] {
  if (!description) {
    return [<p key="no-desc" className="font-small">No description available.</p>];
  }

  // Load the plain text into Cheerio
  const $ = cheerio.load('<div id="content"></div>');
  const content = $('#content');

  // Split description into lines for better parsing
  const lines = description.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  let currentList: string[] = [];
  let inList = false;

  lines.forEach(line => {
    if (/^(Job Title|Company|Location|Employment Type|Salary|Job Type):/i.test(line)) {
      // Format job metadata as a flex row
      const [key, value] = line.split(':').map(part => part.trim());
      content.append(`<div class="flex flex-col md:flex-row md:items-center mb-1">
          <span class="font-small mr-2">${key}:</span>
          <span class=" font-small">${value}</span>
        </div>`);
    } else if (/^(Responsibilities|Requirements|Qualifications|Job Description):/i.test(line)) {
      // Handle section headers
      content.append(`<h3 class="text-lg font-bold mt-4 mb-2">${line}</h3>`);
      if (inList) {
        content.append(`<ul class="list-disc pl-6 my-2">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
    } else if (/^[•\*\-\+]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      // Bullet points and numbered lists
      currentList.push(`<li>${line.replace(/^[•\*\-\+]\s+|\d+\.\s+/, '')}</li>`);
      inList = true;
    } else {
      // Close lists when a normal paragraph starts
      if (inList) {
        content.append(`<ul class="list-disc pl-6 my-2">${currentList.join('')}</ul>`);
        currentList = [];
        inList = false;
      }
      content.append(`<p class="my-2">${line}</p>`);
    }
  });

  // Close any open lists
  if (inList) {
    content.append(`<ul class="list-disc pl-6 my-2">${currentList.join('')}</ul>`);
  }

  // Sanitize the HTML output to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(content.html() || '');

  // Return the formatted job description as a React component
  return [
    <div key="description-content" className="job-description prose max-w-none text-gray-800"
         dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  ];
}
