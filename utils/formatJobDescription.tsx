import React, { ReactNode } from 'react';

/**
 * Enhanced job description formatter that uses pattern recognition to format plain text job descriptions
 * with appropriate HTML elements for better readability.
 * 
 * @param description The raw job description text
 * @returns An array of React elements representing the formatted description
 */
export function formatJobDescription(description: string): ReactNode[] {
  if (!description) return [<p key="no-desc" className="font-medium">No description available.</p>];
  
  // Pre-process the description
  let processedDesc = description
    // Replace multiple consecutive newlines with double newlines
    .replace(/\n{3,}/g, '\n\n')
    // Add a line break before sections that should stand out
    .replace(/\b(REQUIREMENTS|QUALIFICATIONS|RESPONSIBILITIES|ABOUT US|SKILLS|EXPERIENCE|DUTIES|EDUCATION|BENEFITS|JOB DESCRIPTION|WHAT YOU'LL DO)\b/gi, 
             '\n$1')
    // Add proper spacing after bullet points if missing
    .replace(/^(\s*)([\*\-•]|(\d+\.))\s?(?=\S)/gm, '$1$2 ')
    // Make sure there's a space after a colon if there isn't one
    .replace(/(\w+):([\S])/g, '$1: $2')
    // Ensure new lines after periods that end paragraphs (when followed by a capital letter)
    .replace(/\.(\s)([A-Z])/g, '.\n$2')
    // Add a new line before lists when there isn't one
    .replace(/([a-z])(\s*)(\n?)(\s*)([\*\-•]|\d+\.)\s+/g, '$1\n$5 ');
  
  // Ensure each block with bullet points is well separated 
  processedDesc = processedDesc.split('\n').map(line => {
    // If this line has a bullet point and the previous didn't end with a newline, add extra space
    if (line.match(/^\s*([\*\-•]|\d+\.)\s+/) && !line.startsWith('  ')) {
      return '  ' + line;
    }
    return line;
  }).join('\n');
  
  // Track if we're inside a list for better formatting
  let inList = false;
  let prevLineWasList = false;
  
  // Split on line breaks and process each line
  const elements = processedDesc.split("\n").map((line, index) => {
    // Empty line - render as a gap and reset list state
    if (line.trim().length === 0) {
      prevLineWasList = inList;
      inList = false;
      return <div key={`gap-${index}`} className="h-3"></div>;
    }
    
    // Check if it's a main header (ALL CAPS with length > 4)
    if (line.trim().match(/^[A-Z][A-Z\s\d]{3,}$/) && line.trim().length > 4) {
      inList = false;
      return (
        <h2 key={`header-${index}`} className="font-bold text-green-800 dark:text-green-300 mt-5 mb-3 text-lg border-b border-green-100 dark:border-green-900/40 pb-1">
          {line.trim()}
        </h2>
      );
    }
    
    // Check for section headers (starts with common section names)
    const sectionMatches = 
      line.trim().match(/^(REQUIREMENTS|QUALIFICATIONS|RESPONSIBILITIES|ABOUT US|SKILLS|EXPERIENCE|EDUCATION|BENEFITS|KEY RESPONSIBILITIES|JOB DESCRIPTION|WHO WE ARE|WHAT YOU'LL DO|DUTIES)[\s:-]*/i);
    
    if (sectionMatches) {
      inList = false;
      return (
        <h3 key={`section-${index}`} className="font-bold text-green-700 dark:text-green-300 mt-5 mb-3 text-base border-b border-green-200 dark:border-green-800 pb-1">
          {line.trim()}
        </h3>
      );
    }
    
    // Check for subsection headers (Title Case or ends with colon)
    const isSubheader = 
      (line.trim().match(/^([A-Z][a-z]+\s?)+:?$/) && line.length < 60) || 
      (line.trim().match(/^[A-Za-z\s\d]{3,}:$/) && !line.trim().includes(' ')) ||
      (line.trim().length < 40 && line.trim().match(/^[\w\s]+:/));
    
    if (isSubheader) {
      inList = false;
      return (
        <h4 key={`subheader-${index}`} className="font-semibold mt-4 mb-2 text-base text-green-800 dark:text-green-300">
          {line.trim()}
        </h4>
      );
    }
    
    // Check for bullet points (*, -, •, or number followed by dot)
    const bulletMatches = line.match(/^(\s*)([\*\-•]|\d+\.)\s+(.+)$/);
    
    if (bulletMatches) {
      // It's a bullet point
      const [_, leadingSpace, bullet, content] = bulletMatches;
      
      // If we weren't in a list before and the previous line wasn't the end of a list,
      // add some extra spacing
      const extraClass = (!prevLineWasList && !inList) ? 'mt-3' : '';
      
      inList = true;
      prevLineWasList = true;
      
      // Check if this bullet point contains a requirement/skill that should be highlighted
      const isSkill = 
        /(experience|knowledge|proficient|skill|degree|familiar|years|education|qualification|required)/i.test(content.toLowerCase());
      
      // Process links in content
      const processedContent = linkifyText(content);
      
      return (
        <div key={`bullet-${index}`} className={`flex mb-2 ml-2 ${extraClass} ${isSkill ? 'font-medium' : ''}`}>
          <span className="mr-2 font-medium min-w-[20px]">{bullet}</span>
          <div className={isSkill ? 'font-medium' : ''}>
            {processedContent}
          </div>
        </div>
      );
    }
    
    // Reset list status if we're not in a bullet point
    prevLineWasList = inList;
    
    // Check for likely contact info (email or phone)
    if (line.match(/[\w.-]+@[\w.-]+\.\w+/) || line.match(/\+?[\d\s()-]{7,}/)) {
      inList = false;
      return (
        <p key={`contact-${index}`} className="mb-3 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          {line.trim()}
        </p>
      );
    }
    
    // Check for application instructions
    if (/apply|email your|send your|application|submit your/i.test(line.toLowerCase()) && line.length < 100) {
      inList = false;
      return (
        <div key={`apply-${index}`} className="my-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500">
          <p className="font-medium">{linkifyText(line.trim())}</p>
        </div>
      );
    }
    
    // Check for job details like salary, location, etc.
    const isJobDetail = 
      /\b(salary|compensation|location|contract|remote|position|start date|job type|duration)[:]/i.test(line) && 
      line.length < 100;
      
    if (isJobDetail) {
      inList = false;
      return (
        <p key={`detail-${index}`} className="mb-2 font-medium text-green-800 dark:text-green-300">
          {line.trim()}
        </p>
      );
    }
    
    // Regular paragraph - check if it's a continuation of a list
    if (!inList) {
      // Check if this paragraph is very long and might need better spacing
      const isLongParagraph = line.trim().length > 200;
      
      return (
        <p key={`para-${index}`} className={`mb-3 ${isLongParagraph ? 'leading-relaxed' : ''}`}>
          {linkifyText(line.trim())}
        </p>
      );
    } else {
      // It's part of a list but not starting with a bullet - indent it
      return (
        <p key={`list-cont-${index}`} className="mb-2 ml-8">
          {linkifyText(line.trim())}
        </p>
      );
    }
  });
  
  // Post-process to group related elements together
  return elements;
}

/**
 * Helper function to automatically detect URLs in text and convert them to links
 * @param text The input text that might contain URLs
 * @returns React elements with URLs converted to anchor links
 */
export function linkifyText(text: string): ReactNode[] {
  if (!text) return [text];
  
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
} 