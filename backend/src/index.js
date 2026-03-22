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
app.use(express.json());

// Configure Multer for memory storage (for PDF upload)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// --- CV Analysis Logic ---
const analyzeCVText = (text) => {
  const lowerText = text.toLowerCase();
  
  // Simple keyword detection for skills
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node.js', 'express', 'sql', 'mongodb',
    'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'html', 'css', 'typescript',
    'machine learning', 'data analysis', 'project management', 'communication', 'leadership'
  ];

  const foundSkills = skillKeywords.filter(skill => lowerText.includes(skill));

  // Estimate experience (very basic heuristic looking for years)
  const yearMatches = text.match(/(\d{4})\s*[-–to]+\s*(\d{4}|present)/gi);
  let yearsExperience = 0;
  if (yearMatches) {
    // Rough calculation: count unique ranges or assume average 2 years per entry if simple list
    yearsExperience = Math.max(1, Math.floor(yearMatches.length * 1.5)); 
  }
  
  // Detect education level
  let educationLevel = 'Unknown';
  if (lowerText.includes('phd') || lowerText.includes('doctorate')) educationLevel = 'PhD';
  else if (lowerText.includes('master') || lowerText.includes('msc') || lowerText.includes('mba')) educationLevel = 'Master\'s';
  else if (lowerText.includes('bachelor') || lowerText.includes('bsc') || lowerText.includes('ba')) educationLevel = 'Bachelor\'s';

  // Determine current role guess
  let suggestedRole = 'General Professional';
  if (foundSkills.includes('react') || foundSkills.includes('javascript')) suggestedRole = 'Frontend Developer';
  if (foundSkills.includes('node.js') || foundSkills.includes('express')) suggestedRole = 'Backend Developer';
  if (foundSkills.includes('python') && foundSkills.includes('machine learning')) suggestedRole = 'Data Scientist';
  if (foundSkills.includes('project management') || foundSkills.includes('agile')) suggestedRole = 'Project Manager';

  // Generate Career Path & Development Points
  const careerPath = [
    `Current Level: Junior/Mid ${suggestedRole}`,
    `Next Step: Senior ${suggestedRole}`,
    `Long Term: Lead ${suggestedRole} or Engineering Manager`,
    `Alternative: Transition to ${foundSkills.includes('management') ? 'Product Management' : 'Solutions Architecture'}`
  ];

  const developmentPoints = [
    `Deepen expertise in ${foundSkills[0] || 'core technical skills'}`,
    `Gain experience with cloud platforms (AWS/Azure)`,
    `Develop soft skills: Leadership and Mentorship`,
    `Contribute to open source or lead a major project`,
    `Obtain relevant certifications (e.g., AWS Certified, PMP)`
  ];

  return {
    extractedText: text.substring(0, 500) + "...", // Preview only
    skills: foundSkills,
    yearsExperience,
    educationLevel,
    suggestedRole,
    careerPath,
    developmentPoints
  };
};

// --- API Routes ---

// Text-based analysis endpoint
app.post('/api/analyze-text', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }
  const result = analyzeCVText(text);
  res.json(result);
});

// PDF Upload and Analysis endpoint
app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Parse the PDF
    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    // Analyze the extracted text
    const analysis = analyzeCVText(text);

    res.json({
      fileName: req.file.originalname,
      ...analysis
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CV Career Advisor API is running' });
});

// --- SERVE FRONTEND (CRITICAL FIX) ---
// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Catch-all handler to serve index.html for any unknown route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend served from: ${path.join(__dirname, '../../frontend/dist')}`);
});
