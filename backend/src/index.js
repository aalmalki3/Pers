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

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer
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

// --- ONLY PDF READING ENDPOINT ---
app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`Received file: ${req.file.originalname}, Size: ${req.file.size}`);

    // Extract text using pdf-parse
    const data = await pdfParse(req.file.buffer);
    
    console.log(`Successfully parsed. Pages: ${data.npages}, Length: ${data.text.length}`);

    // Return ONLY the raw text for now
    res.json({ 
      success: true,
      fileName: req.file.originalname,
      pageCount: data.npages,
      extractedText: data.text 
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to read PDF', 
      details: error.message 
    });
  }
});

// Serve Frontend (Static)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
