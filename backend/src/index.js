import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'), false);
  }
});

// --- ANALYSIS ENGINE (10-Point Standard) ---
const analyzeCV = (text) => {
  const fullTextLower = text.toLowerCase();
  const issues = [];
  const strengths = [];
  const solutions = {};
  
  // Track which of the 10 standards are met
  let score = 0;
  const maxScore = 10;

  // Helper to add issue
  const addIssue = (id, severity, category, title, description, fixList) => {
    issues.push({ id, severity, category, title, description });
    solutions[id] = fixList;
  };

  // --- CRITERION 1: Contact Info (10 pts) ---
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) || /\+\d{9,}/.test(text);
  if (hasEmail && hasPhone) {
    score++;
    strengths.push("Contact information is complete and ATS-readable.");
  } else {
    addIssue('contact_info', 'critical', 'ATS Basics', 'Missing Contact Details', 'ATS cannot route your application without email/phone.', [
      'Add email and phone number at the very top header.',
      'Ensure no special characters block the text extraction.'
    ]);
  }

  // --- CRITERION 2: Standard Headings (10 pts) ---
  const standardHeadings = ['experience', 'education', 'skills', 'summary', 'work history'];
  const foundCount = standardHeadings.filter(h => fullTextLower.includes(h)).length;
  if (foundCount >= 3) {
    score++;
    strengths.push("Uses standard section headings recognized by ATS.");
  } else {
    addIssue('headings', 'high', 'Structure', 'Non-Standard Headings', 'Creative headings confuse ATS parsers.', [
      'Rename sections to "Professional Experience", "Education", "Skills".',
      'Avoid titles like "My Journey" or "Where I\'ve Been".'
    ]);
  }

  // --- CRITERION 3: Professional Summary (10 pts) ---
  if (fullTextLower.includes('summary') || fullTextLower.includes('profile') || fullTextLower.includes('about me')) {
    score++;
    strengths.push("Includes a professional summary.");
  } else {
    addIssue('summary', 'medium', 'Content', 'Missing Professional Summary', 'Recruiters need a 3-line overview of your value.', [
      'Add a "Professional Summary" at the top.',
      'Include: Years of experience + Core Role + Top 2 Skills.'
    ]);
  }

  // --- CRITERION 4: Quantifiable Metrics (SMARTER DETECTION) (10 pts) ---
  // Updated Regex to catch: 300+, 120+, $100k, 20%, 15%, SAR, increased, reduced
  const metricRegex = /(\d+\+|\d+%|\$\d+[kmb]?|\d{3,}(,\d{3})*|SAR\s*\d+|increased|reduced|saved|generated|grew)/i;
  if (metricRegex.test(text)) {
    score++;
    strengths.push("Contains quantifiable achievements and metrics.");
  } else {
    addIssue('metrics', 'high', 'Impact', 'Lack of Quantifiable Achievements', 'Your CV lists duties but lacks numbers.', [
      'Add specific numbers: "Managed 300+ staff", "Saved SAR 100k".',
      'Use percentages: "Improved efficiency by 20%".',
      'Highlight budget sizes or team counts.'
    ]);
  }

  // --- CRITERION 5: Action Verbs (10 pts) ---
  const weakVerbs = ['responsible for', 'duties included', 'tasked with'];
  const hasWeak = weakVerbs.some(v => fullTextLower.includes(v));
  if (!hasWeak) {
    score++;
    strengths.push("Uses strong, active action verbs.");
  } else {
    addIssue('verbs', 'medium', 'Language', 'Passive Language Detected', 'Phrases like "Responsible for" weaken your profile.', [
      'Replace with "Led", "Orchestrated", "Directed".',
      'Start every bullet with a power verb.'
    ]);
  }

  // --- CRITERION 6: Date Formatting (10 pts) ---
  const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\b\d{1,2}[\/\-]\d{2,4}\b/i;
  if (dateRegex.test(text)) {
    score++;
    strengths.push("Dates are formatted in an ATS-friendly manner.");
  } else {
    addIssue('dates', 'high', 'Formatting', 'Inconsistent Date Format', 'ATS struggles to parse non-standard dates.', [
      'Use "MM/YYYY" or "Month YYYY" format consistently.',
      'Avoid relative dates like "Last 3 years".'
    ]);
  }

  // --- CRITERION 7: Skills Section (10 pts) ---
  // Check for a dedicated skills list or keywords
  const hasSkillsSection = fullTextLower.includes('skills') || fullTextLower.includes('competencies') || fullTextLower.includes('expertise');
  // Or check for a list of hard skills (simplified)
  const commonSkills = ['javascript', 'python', 'management', 'strategy', 'budgeting', 'hiring', 'recruitment', 'operations'];
  const hasSkillKeywords = commonSkills.some(s => fullTextLower.includes(s));
  
  if (hasSkillsSection || hasSkillKeywords) {
    score++;
    strengths.push("Key skills are identifiable.");
  } else {
    addIssue('skills', 'medium', 'Content', 'Missing Dedicated Skills Section', 'ATS scans for a specific list of hard skills.', [
      'Add a "Core Skills" section with 6-12 keywords.',
      'Match keywords from the job description.'
    ]);
  }

  // --- CRITERION 8: Education Clarity (10 pts) ---
  const eduKeywords = ['university', 'college', 'degree', 'bachelor', 'master', 'diploma'];
  if (eduKeywords.some(k => fullTextLower.includes(k))) {
    score++;
    strengths.push("Education history is clearly stated.");
  } else {
    addIssue('education', 'low', 'Background', 'Education Details Unclear', 'Ensure degree and institution are explicit.', [
      'Format: Degree Name, University, Graduation Year.',
      'Include certifications if relevant.'
    ]);
  }

  // --- CRITERION 9: Length & Conciseness (10 pts) ---
  // Simple heuristic: < 2500 words is usually good for < 15 years exp, > 15 years can be longer
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 300 && wordCount < 3000) {
    score++;
    strengths.push("CV length is within optimal range.");
  } else if (wordCount > 3000) {
    addIssue('length', 'low', 'Format', 'CV May Be Too Long', 'Recruiters spend ~6 seconds scanning. Keep it concise.', [
      'Remove roles older than 10-15 years unless critical.',
      'Condense early career into a "Previous Experience" summary.'
    ]);
  } else {
    score++; // Too short is rare for senior roles, give benefit of doubt or flag differently
    strengths.push("CV is concise.");
  }

  // --- CRITERION 10: Gap/Stability Check (10 pts) ---
  // Heuristic: Count roles vs years span
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const uniqueYears = [...new Set(yearMatches.map(Number))];
  const span = uniqueYears.length > 0 ? Math.max(...uniqueYears) - Math.min(...uniqueYears) : 0;
  const roleCount = (text.match(/(manager|director|head|vp|ceo|officer|specialist|analyst|consultant)/gi) || []).length;
  
  // If span > 10 years and roles < 4, likely gaps or job hopping
  if (span > 10 && roleCount >= 4) {
    score++;
    strengths.push("Career trajectory shows consistent progression.");
  } else if (span > 10 && roleCount < 4) {
    addIssue('gaps', 'high', 'History', 'Potential Employment Gaps', 'Long career span with few detailed roles may indicate gaps.', [
      'Explicitly list "Career Break" or "Consulting" for gap periods.',
      'Group short contracts under one header.'
    ]);
  } else {
    score++; // Younger career or sufficient roles
    strengths.push("Employment history appears consistent.");
  }

  // Calculate Percentage
  const percentage = Math.round((score / maxScore) * 100);

  return { 
    score, 
    maxScore, 
    percentage,
    issues, 
    strengths, 
    solutions,
    rawText: text 
  };
};

app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    const data = await pdfParse(req.file.buffer);
    const analysis = analyzeCV(data.text);
    res.json({ success: true, fileName: req.file.originalname, ...analysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed', details: error.message });
  }
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
