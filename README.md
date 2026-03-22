# CV Career Advisor

A web application that reads PDF CVs and suggests career paths and development points.

## Features

- **PDF Upload**: Upload your CV in PDF format
- **Automatic Analysis**: Extracts skills, experience, education, and current role
- **Career Suggestions**: Get personalized career path recommendations
- **Development Points**: Receive actionable tips for professional growth
- **Skill Recommendations**: Discover which skills to learn next

## Tech Stack

### Backend
- Node.js with Express
- pdf-parse for PDF text extraction
- Custom career analysis engine

### Frontend
- React 18
- Vite for fast development
- Modern CSS with responsive design

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

#### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/cv/analyze
Upload a PDF CV for analysis

**Request:**
- Content-Type: multipart/form-data
- File: cv (PDF file)

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedText": "...",
    "pageCount": 2,
    "analysis": {
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": { "years": 5 },
      "education": { "degrees": ["B.S. Computer Science"] },
      "currentRole": "Software Engineer",
      "seniority": "Mid Level"
    },
    "suggestions": {
      "careerPaths": ["Senior Software Engineer", "Tech Lead"],
      "developmentPoints": ["Master system design", "Improve leadership skills"],
      "recommendedSkills": ["TypeScript", "AWS"]
    }
  }
}
```

### POST /api/cv/analyze-text
Analyze CV from raw text

**Request:**
```json
{
  "text": "Your CV text here..."
}
```

### GET /api/health
Health check endpoint

## Project Structure

```
cv-career-advisor/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server entry point
│   │   ├── routes/
│   │   │   └── cv.js         # CV analysis routes
│   │   ├── services/
│   │   │   └── careerAdvisor.js  # Career analysis logic
│   │   └── utils/
│   │       ├── multer.js     # File upload configuration
│   │       └── pdfExtractor.js # PDF text extraction
│   ├── uploads/              # Temporary file storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # React entry point
│   │   └── *.css             # Styles
│   ├── index.html
│   └── package.json
└── package.json              # Root package.json
```

## How It Works

1. **Upload**: User uploads a PDF CV through the web interface
2. **Extract**: Backend extracts text from the PDF using pdf-parse
3. **Analyze**: Custom algorithms identify:
   - Skills (technical and soft skills)
   - Years of experience
   - Education level
   - Current role and seniority
4. **Suggest**: Based on the analysis, the system recommends:
   - Next career steps
   - Skills to develop
   - Areas for improvement
5. **Display**: Results are shown in an easy-to-read format

## Customization

You can customize the career suggestions by editing:
- `backend/src/services/careerAdvisor.js` - Modify analysis logic and suggestions
- Add more skills to detect in the `extractSkills` function
- Adjust career path recommendations based on your industry

## License

MIT
