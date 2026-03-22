import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// --- ADVANCED CV ANALYSIS ENGINE ---

const analyzeCVText = (text) => {
  const cleanText = text.replace(/\n/g, ' ');
  const lowerText = cleanText.toLowerCase();

  // 1. SKILL EXTRACTION
  const skillCategories = {
    languages: ['javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust', 'php', 'ruby', 'sql', 'r', 'matlab'],
    frontend: ['react', 'angular', 'vue', 'svelte', 'html5', 'css3', 'tailwind', 'bootstrap', 'redux', 'next.js', 'nuxt'],
    backend: ['node.js', 'express', 'django', 'flask', 'spring boot', 'laravel', 'asp.net', 'fastapi', 'graphql', 'rest api'],
    database: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase', 'dynamodb', 'oracle'],
    devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'linux'],
    tools: ['git', 'jira', 'figma', 'postman', 'webpack', 'babel', 'npm', 'yarn']
  };

  const foundSkills = {
    languages: [],
    frontend: [],
    backend: [],
    database: [],
    devops: [],
    tools: []
  };

  Object.keys(skillCategories).forEach(category => {
    skillCategories[category].forEach(skill => {
      // Use regex to match whole words only
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(cleanText)) {
        foundSkills[category].push(skill);
      }
    });
  });

  const allSkills = Object.values(foundSkills).flat();

  // 2. EXPERIENCE CALCULATION (Counting Years)
  let yearsExperience = 0;
  
  // Pattern 1: "2018 - Present" or "2018-2022"
  const dateRangeRegex = /(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi;
  const matches = [...cleanText.matchAll(dateRangeRegex)];
  
  matches.forEach(match => {
    const startYear = parseInt(match[1]);
    const endStr = match[2].toLowerCase();
    const endYear = (endStr === 'present' || endStr === 'current') ? new Date().getFullYear() : parseInt(endStr);
    
    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      yearsExperience += (endYear - startYear);
    }
  });

  // Fallback: If no dates found, look for "X years experience" pattern
  if (yearsExperience === 0) {
    const yearCountRegex = /(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/i;
    const countMatch = cleanText.match(yearCountRegex);
    if (countMatch) {
      yearsExperience = parseInt(countMatch[1]);
    }
  }

  // 3. POSITION / ROLE DETECTION
  const roleKeywords = [
    { title: 'Software Engineer', keywords: ['software engineer', 'developer', 'programmer', 'full stack', 'backend engineer', 'frontend engineer'] },
    { title: 'Data Scientist', keywords: ['data scientist', 'machine learning engineer', 'ai engineer', 'data analyst', 'ml engineer'] },
    { title: 'DevOps Engineer', keywords: ['devops', 'site reliability engineer', 'sre', 'cloud engineer', 'infrastructure engineer'] },
    { title: 'Product Manager', keywords: ['product manager', 'project manager', 'scrum master', 'product owner'] },
    { title: 'UX/UI Designer', keywords: ['ux designer', 'ui designer', 'product designer', 'interaction designer'] },
    { title: 'QA Engineer', keywords: ['qa engineer', 'test engineer', 'automation engineer', 'quality assurance'] },
    { title: 'Security Engineer', keywords: ['security engineer', 'cybersecurity', 'penetration tester', 'infosec'] }
  ];

  let detectedRole = 'General Professional';
  let roleConfidence = 0;

  roleKeywords.forEach(role => {
    const count = role.keywords.filter(k => lowerText.includes(k)).length;
    if (count > roleConfidence) {
      roleConfidence = count;
      detectedRole = role.title;
    }
  });

  // 4. EDUCATION & CERTIFICATION ANALYSIS
  const educationLevels = [
    { level: 'PhD / Doctorate', keywords: ['phd', 'doctorate', 'd.phil', 'doctor of philosophy'] },
    { level: 'Master\'s Degree', keywords: ['master', 'msc', 'm.sc', 'mba', 'm.eng', 'm.a'] },
    { level: 'Bachelor\'s Degree', keywords: ['bachelor', 'bsc', 'b.sc', 'ba', 'b.eng', 'b.tech', 'be'] },
    { level: 'Associate Degree', keywords: ['associate', 'aa', 'as'] }
  ];

  let highestEducation = 'Not Specified';
  const educationPriority = { 'PhD / Doctorate': 4, 'Master\'s Degree': 3, 'Bachelor\'s Degree': 2, 'Associate Degree': 1, 'Not Specified': 0 };

  educationLevels.forEach(edu => {
    if (edu.keywords.some(k => lowerText.includes(k))) {
      if (educationPriority[edu.level] > educationPriority[highestEducation]) {
        highestEducation = edu.level;
      }
    }
  });

  // Certifications Detection
  const certKeywords = ['certified', 'certificate', 'certification', 'aws certified', 'pmp', 'cissp', 'ccna', 'google cloud', 'azure certified', 'scrum master'];
  const hasCertifications = certKeywords.some(k => lowerText.includes(k));
  const certificationsFound = [];
  
  // Simple extraction of lines containing "certified"
  const lines = text.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('certified') || line.toLowerCase().includes('certificate')) {
      certificationsFound.push(line.trim());
    }
  });

  // 5. GENERATE CAREER PATH & DEVELOPMENT POINTS
  const generateCareerPath = (role, exp, edu) => {
    const paths = [];
    
    if (exp < 2) {
      paths.push(`Junior ${role}`);
      paths.push(`Mid-Level ${role} (Target in 1-2 years)`);
      paths.push(`Senior ${role} (Target in 3-5 years)`);
    } else if (exp < 5) {
      paths.push(`Mid-Level ${role}`);
      paths.push(`Senior ${role} (Target in 2-3 years)`);
      paths.push(`Lead ${role} or Engineering Manager (Target in 5+ years)`);
    } else {
      paths.push(`Senior ${role}`);
      paths.push(`Lead ${role} / Staff Engineer`);
      paths.push(`Principal Engineer / Director / CTO`);
    }

    if (edu.includes('Master') || edu.includes('PhD')) {
      paths.push(`Research Scientist / AI Specialist (Leveraging advanced degree)`);
    }

    return paths;
  };

  const generateDevelopmentPoints = (role, skills, exp, hasCerts) => {
    const points = [];

    // Skill gaps
    if (!skills.devops.includes('docker') && !skills.devops.includes('kubernetes')) {
      points.push('Learn Containerization (Docker & Kubernetes) - Industry Standard');
    }
    if (!skills.devops.includes('aws') && !skills.devops.includes('azure') && !skills.devops.includes('gcp')) {
      points.push('Obtain Cloud Certification (AWS/Azure/GCP)');
    }
    
    // Experience based
    if (exp < 3) {
      points.push('Focus on mastering core algorithms and data structures');
      points.push('Contribute to open-source projects to build portfolio');
    } else {
      points.push('Develop leadership and mentorship skills');
      points.push('Lead large-scale system design projects');
    }

    // Role specific
    if (role.includes('Data')) {
      points.push('Deepen knowledge in Deep Learning frameworks (PyTorch/TensorFlow)');
    } else if (role.includes('Engineer')) {
      points.push('Master System Design and Architecture patterns');
    }

    if (!hasCerts) {
      points.push('Obtain a relevant professional certification (e.g., PMP, AWS, Scrum)');
    }

    return points.slice(0, 5); // Return top 5
  };

  const careerPath = generateCareerPath(detectedRole, yearsExperience, highestEducation);
  const developmentPoints = generateDevelopmentPoints(detectedRole, foundSkills, yearsExperience, hasCertifications);

  return {
    summary: {
      detectedRole,
      yearsExperience,
      highestEducation,
      hasCertifications,
      totalSkillsFound: allSkills.length
    },
    skills: foundSkills,
    certifications: certificationsFound.slice(0, 5), // Top 5 found
    careerPath,
    developmentPoints,
    rawTextPreview: text.substring(0, 300) + "..."
  };
};

// --- API ROUTES ---

app.post('/api/analyze-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  
  try {
    const result = analyzeCVText(text);
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`Processing file: ${req.file.originalname}, Size: ${req.file.size}`);

    // Parse PDF
    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from PDF. Ensure it is not an image-only scan.' });
    }

    // Analyze
    const analysis = analyzeCVText(text);

    res.json({
      fileName: req.file.originalname,
      ...analysis
    });

  } catch (error) {
    console.error('Upload/Parse error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze CV', 
      details: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📂 Serving frontend from: ${path.join(__dirname, '../../frontend/dist')}`);
});
