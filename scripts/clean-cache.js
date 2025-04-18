// This script cleans the cache of non-English job listings
const fs = require('fs');
const path = require('path');

// Get path to cache file
const CACHE_FILE_PATH = path.join(process.cwd(), '.job-cache.json');

console.log('Go9jaJobs Cache Cleaning Utility');
console.log('================================');

// Check if cache file exists
if (!fs.existsSync(CACHE_FILE_PATH)) {
  console.error('Cache file not found. No jobs cached yet.');
  process.exit(1);
}

try {
  // Read the cache file
  const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
  
  if (!cacheData || !cacheData.jobs || !Array.isArray(cacheData.jobs)) {
    console.error('Invalid cache data structure. Cannot process.');
    process.exit(1);
  }

  const originalJobs = cacheData.jobs;
  const originalCount = originalJobs.length;
  
  console.log(`Found ${originalCount} jobs in cache.`);
  console.log('Filtering out non-English jobs...');
  
  // Filter out non-English jobs
  const filteredJobs = originalJobs.filter(job => !isNonEnglishJob(job));
  const removedCount = originalCount - filteredJobs.length;
  
  if (removedCount > 0) {
    // Update the cache file
    cacheData.jobs = filteredJobs;
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));
    
    console.log(`✅ SUCCESS: Removed ${removedCount} non-English jobs from cache.`);
    console.log(`Cache now contains ${filteredJobs.length} jobs.`);
  } else {
    console.log('✅ SUCCESS: No non-English jobs found in the cache. Nothing to remove.');
  }
} catch (error) {
  console.error('❌ ERROR processing cache:', error);
  process.exit(1);
}

// Language detection function
function isNonEnglishJob(job) {
  if (!job || !job.description || job.description.trim() === '') {
    return false;
  }
  
  // Combine all text fields for analysis
  const textToAnalyze = [
    job.title || '',
    job.description || '',
    job.company || ''
  ].join(' ').toLowerCase();
  
  // Define language detection patterns
  const DUTCH_KEYWORDS = [
    'wij bieden', 'bruto', 'tussen', 'voor', 'schaal', 'volgens cao', 'vakantie',
    'uitkering', 'vergoeding', 'zorgverzekering', 'secundaire', 'arbeidsvoorwaarden',
    'pensioensregeling', 'welzijn', 'onboardingstraject', 'ontwikkelen', 'plezier',
    'trots', 'diploma', 'kinderopvang', 'bevoegd', 'bijvoorbeeld'
  ];
  
  const PORTUGUESE_KEYWORDS = [
    'atividades', 'para início imediato', 'assessorando', 'produção', 'liderar',
    'equipe', 'suporte', 'garantir', 'manutenção', 'visando', 'corretiva', 'preventiva',
    'funcionamento', 'equipamentos', 'administrar', 'recursos', 'condições', 'instalações',
    'realizar', 'quando necessário', 'cumprir', 'planos', 'requisitos', 'experiência',
    'segmento', 'residir', 'disponibilidade', 'benefícios'
  ];
  
  const SPANISH_KEYWORDS = [
    'experiencia', 'líder', 'requisitos', 'responsabilidades', 'habilidades',
    'conocimientos', 'buscamos', 'ofrece', 'jornada', 'contrato', 'salario',
    'formación', 'perfil', 'empresa', 'puesto', 'ubicación', 'vacante'
  ];
  
  // Count foreign language indicators
  let dutchCount = 0;
  let portugueseCount = 0;
  let spanishCount = 0;
  
  // Check for Dutch words/phrases
  for (const keyword of DUTCH_KEYWORDS) {
    if (textToAnalyze.includes(keyword.toLowerCase())) {
      dutchCount++;
    }
  }
  
  // Check for Portuguese words/phrases
  for (const keyword of PORTUGUESE_KEYWORDS) {
    if (textToAnalyze.includes(keyword.toLowerCase())) {
      portugueseCount++;
    }
  }
  
  // Check for Spanish words/phrases
  for (const keyword of SPANISH_KEYWORDS) {
    if (textToAnalyze.includes(keyword.toLowerCase())) {
      spanishCount++;
    }
  }
  
  // Calculate language detection thresholds
  const isDutch = dutchCount >= 3;
  const isPortuguese = portugueseCount >= 3;
  const isSpanish = spanishCount >= 3;
  
  // Additional specific patterns to check
  const containsBSO = job.title?.includes('BSO') || false;
  const containsPedagogisch = job.title?.includes('Pedagogisch') || false;
  const containsLIDER = job.title?.includes('LÍDER') || job.title?.includes('LIDER') || false;
  
  // Return true if the job is likely in a non-English language
  return (
    isDutch || 
    isPortuguese || 
    isSpanish || 
    (containsBSO && containsPedagogisch) ||
    containsLIDER
  );
} 