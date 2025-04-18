import { Job } from '../types/job';

// Common Dutch words and phrases that appear in job listings
const DUTCH_KEYWORDS = [
  'wij bieden', 'bruto', 'tussen', 'voor', 'schaal', 'volgens cao', 'vakantie',
  'uitkering', 'vergoeding', 'zorgverzekering', 'secundaire', 'arbeidsvoorwaarden',
  'pensioensregeling', 'welzijn', 'onboardingstraject', 'ontwikkelen', 'plezier',
  'trots', 'diploma', 'kinderopvang', 'bevoegd', 'bijvoorbeeld'
];

// Common Portuguese words and phrases that appear in job listings
const PORTUGUESE_KEYWORDS = [
  'atividades', 'para início imediato', 'assessorando', 'produção', 'liderar',
  'equipe', 'suporte', 'garantir', 'manutenção', 'visando', 'corretiva', 'preventiva',
  'funcionamento', 'equipamentos', 'administrar', 'recursos', 'condições', 'instalações',
  'realizar', 'quando necessário', 'cumprir', 'planos', 'requisitos', 'experiência',
  'segmento', 'residir', 'disponibilidade', 'benefícios'
];

// Common Spanish words and phrases that appear in job listings
const SPANISH_KEYWORDS = [
  'experiencia', 'líder', 'requisitos', 'responsabilidades', 'habilidades',
  'conocimientos', 'buscamos', 'ofrece', 'jornada', 'contrato', 'salario',
  'formación', 'perfil', 'empresa', 'puesto', 'ubicación', 'vacante'
];

/**
 * Detects if a job description is likely in a non-English language
 */
export function isNonEnglishJob(job: Job): boolean {
  // Skip jobs with no description
  if (!job.description || job.description.trim() === '') {
    return false;
  }
  
  // Combine all text fields for analysis
  const textToAnalyze = [
    job.title || '',
    job.description || '',
    job.company || ''
  ].join(' ').toLowerCase();
  
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
  
  // Calculate language detection thresholds (adjust as needed)
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

/**
 * Filter a list of jobs to remove non-English listings
 */
export function filterNonEnglishJobs(jobs: Job[]): Job[] {
  if (!jobs || !Array.isArray(jobs)) {
    return [];
  }
  
  const filteredJobs = jobs.filter(job => !isNonEnglishJob(job));
  
  // Log how many jobs were filtered out
  const removedCount = jobs.length - filteredJobs.length;
  if (removedCount > 0) {
    console.log(`Filtered out ${removedCount} non-English job listings`);
  }
  
  return filteredJobs;
} 