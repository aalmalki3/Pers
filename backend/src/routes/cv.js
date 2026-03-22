import express from 'express';
import { upload } from '../utils/multer.js';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';
import { analyzeCV, generateCareerSuggestions } from '../services/careerAdvisor.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload and analyze CV
router.post('/analyze', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CV file uploaded' });
    }

    // Extract text from PDF
    const pdfData = await extractTextFromPDF(req.file.path);
    
    // Analyze the CV content
    const analysis = analyzeCV(pdfData.text);
    
    // Generate career suggestions
    const suggestions = generateCareerSuggestions(analysis);
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        extractedText: pdfData.text.substring(0, 500) + '...', // First 500 chars preview
        pageCount: pdfData.numpages,
        analysis: {
          skills: analysis.skills,
          experience: analysis.experience,
          education: analysis.education,
          currentRole: analysis.currentRole,
          seniority: analysis.seniority
        },
        suggestions: suggestions
      }
    });
  } catch (error) {
    console.error('Error processing CV:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to process CV',
      message: error.message 
    });
  }
});

// Analyze raw text (alternative endpoint)
router.post('/analyze-text', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Analyze the CV content
    const analysis = analyzeCV(text);
    
    // Generate career suggestions
    const suggestions = generateCareerSuggestions(analysis);

    res.json({
      success: true,
      data: {
        analysis: {
          skills: analysis.skills,
          experience: analysis.experience,
          education: analysis.education,
          currentRole: analysis.currentRole,
          seniority: analysis.seniority
        },
        suggestions: suggestions
      }
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ 
      error: 'Failed to analyze text',
      message: error.message 
    });
  }
});

export default router;
