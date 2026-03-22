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

// --- ANALYSIS ENGINE ---
const analyzeCV = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullTextLower = text.toLowerCase();
  
  const issues = [];
  const strengths = [];
  const solutions = {}; // Map issue ID to solutions

  // 1. ATS COMPATIBILITY CHECKS
  // Check for standard headings
  const standardHeadings = ['experience', 'education', 'skills', 'summary', 'work history', 'employment'];
  const foundHeadings = standardHeadings.filter(h => fullTextLower.includes(h));
  
  if (foundHeadings.length < 3) {
    issues.push({
      id: 'ats_headings',
      severity: 'high',
      category: 'ATS Compatibility',
      title: 'Missing Standard Section Headings',
      description: 'ATS systems rely on standard headings like "Experience" or "Education" to parse your CV. Uncommon headings may cause data loss.'
    });
    solutions['ats_headings'] = [
      'Rename your sections to: "Professional Experience", "Education", "Skills", "Summary".',
      'Ensure headings are bold and on their own line.',
      'Avoid creative titles like "My Journey" or "Where I\'ve Been".'
    ];
  } else {
    strengths.push('Uses standard ATS-friendly section headings.');
  }

  // Check for tables/graphics indicators (often extracted as weird characters or empty spaces in pdf-parse)
  // Note: Pure text extraction can't perfectly detect visual tables, but we can check for layout chaos
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  
  if (!hasEmail || !hasPhone) {
    issues.push({
      id: 'ats_contact',
      severity: 'critical',
      category: 'ATS Compatibility',
      title: 'Contact Information Not Detected',
      description: 'ATS could not find a valid email or phone number in standard format.'
    });
    solutions['ats_contact'] = [
      'Place email and phone at the very top of the CV in a single line.',
      'Use standard format: name@example.com | +1-555-0199.',
      'Avoid putting contact info inside header/footer images.'
    ];
  } else {
    strengths.push('Contact information is clearly detected.');
  }

  // 2. EXPERIENCE & GAP ANALYSIS
  // Simple regex to find date ranges like "01/2020 - 03/2021" or "Jan 2020 – Present"
  const dateRangeRegex = /(\d{1,2}[\/\-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[-–to]+\s*(\d{1,2}[\/\-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current)/gi;
  const datesFound = text.match(dateRangeRegex);

  let gapDetected = false;
  // Heuristic: If we have dates, we assume a timeline exists. 
  // Real gap calculation requires sorting dates, which is complex for a single file demo.
  // Instead, we look for keywords indicating gaps or short tenures.
  
  const shortTenureKeywords = ['months', 'month']; 
  // Check for roles lasting less than a year explicitly mentioned or implied by date proximity
  // For this demo, we flag if the text contains many short duration mentions without explanation
  
  // Check for "Present" to ensure current role is clear
  if (!fullTextLower.includes('present') && !fullTextLower.includes('current')) {
     // Only flag if there are dates, implying an old CV
     if (datesFound && datesFound.length > 0) {
        // Optional warning, skipping for now to reduce noise
     }
  }

  // 3. CONTENT QUALITY & WEAKNESSES
  
  // Check for Metrics/Numbers in bullet points
  const hasMetrics = /(\d+%|\$\d+|\d+\s+(people|team|users|clients|revenue)|increased|reduced|saved)\b/i.test(text);
  if (!hasMetrics) {
    issues.push({
      id: 'no_metrics',
      severity: 'high',
      category: 'Content Quality',
      title: 'Lack of Quantifiable Achievements',
      description: 'Your CV lists duties but lacks numbers (%, $, time saved). Recruiters look for impact.'
    });
    solutions['no_metrics'] = [
      'Add numbers to bullets: "Increased sales by 20%" instead of "Responsible for sales".',
      'Quantify team size: "Led a team of 15..."',
      'Include budget scope: "Managed a $50k budget...".'
    ];
  } else {
    strengths.push('Contains quantifiable achievements and metrics.');
  }

  // Check for Action Verbs
  const weakVerbs = ['responsible for', 'duties included', 'tasked with', 'helped', 'worked on'];
  const foundWeak = weakVerbs.filter(v => fullTextLower.includes(v));
  
  if (foundWeak.length > 0) {
    issues.push({
      id: 'weak_verbs',
      severity: 'medium',
      category: 'Language & Tone',
      title: 'Passive Language Detected',
      description: 'Phrases like "Responsible for" are passive. Use strong action verbs.'
    });
    solutions['weak_verbs'] = [
      'Replace "Responsible for" with "Orchestrated", "Directed", or "Led".',
      'Start bullets with power verbs: "Achieved", "Developed", "Transformed".',
      'Remove "Duties included" and start directly with the action.'
    ];
  } else {
    strengths.push('Uses strong, active action verbs.');
  }

  // Check for Summary
  const hasSummary = fullTextLower.includes('summary') || fullTextLower.includes('profile') || fullTextLower.includes('about me');
  if (!hasSummary) {
    issues.push({
      id: 'no_summary',
      severity: 'medium',
      category: 'Structure',
      title: 'Missing Professional Summary',
      description: 'A 3-line summary at the top helps recruiters and ATS understand your value immediately.'
    });
    solutions['no_summary'] = [
      'Add a "Professional Summary" section at the top.',
      'Write 3 lines: [Role] with [X] years experience in [Industry]. Expert in [Skill 1] and [Skill 2].',
      'Focus on your biggest achievement in the first sentence.'
    ]);
  } else {
    strengths.push('Includes a professional summary.');
  }

  // Specific Gap Logic (Simplified for Text)
  // If we see two dates that are far apart visually in the text without a job in between? 
  // Hard to do perfectly without structured data. 
  // Instead, we check for "Sabbatical", "Career Break" keywords. If missing and long gaps exist (hard to calc here), we advise.
  // Let's add a generic "Employment Gap" advisory if the CV spans many years but has few roles listed.
  const roleCount = (text.match(/(manager|director|head|vp|ceo|officer|specialist|analyst)/gi) || []).length;
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const yearSpan = yearMatches.length > 0 ? (Math.max(...yearMatches.map(Number)) - Math.min(...yearMatches.map(Number))) : 0;
  
  if (yearSpan > 10 && roleCount < 4) {
     issues.push({
      id: 'potential_gaps',
      severity: 'high',
      category: 'Employment History',
      title: 'Potential Employment Gaps Detected',
      description: 'Your career span is ' + yearSpan + ' years, but only ' + roleCount + ' roles are clearly detailed. Unexplained gaps >6 months raise red flags.'
    });
    solutions['potential_gaps'] = [
      'Explicitly list "Career Break" or "Sabbatical" with dates if you were out of the workforce.',
      'Group short-term contracts under a "Consulting" header to bridge gaps.',
      'Add "Freelance" or "Professional Development" entries for gap periods.'
    ]);
  }

  return { issues, strengths, solutions };
};

// --- ENDPOINTS ---
app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const data = await pdfParse(req.file.buffer);
    const text = data.text;
    
    // Run Analysis
    const analysis = analyzeCV(text);

    res.json({ 
      success: true,
      fileName: req.file.originalname,
      rawText: text, // Keep for debugging if needed
      ...analysis 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process', details: error.message });
  }
});

// Serve Frontend
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
