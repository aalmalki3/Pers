# Quick Start Guide

## System Requirements
- Node.js 16+ 
- At least 1GB RAM recommended for installation
- Modern web browser

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies  
```bash
cd frontend
npm install
```

### 3. Run the Application

**Option A: Run both together (from root)**
```bash
npm run dev
```

**Option B: Run separately in different terminals**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 4. Access the Application
Open your browser and navigate to: `http://localhost:5173`

## Testing the Application

1. Prepare a PDF CV/resume file
2. Drag and drop or select the file in the upload area
3. Click "Analyze My CV"
4. View the analysis results including:
   - Detected skills
   - Experience level
   - Current role detection
   - Career path recommendations
   - Development suggestions
   - Skills to learn

## Troubleshooting

### Memory Issues During Installation
If you encounter memory issues during `npm install`, try:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
npm install
```

Or install packages one at a time:
```bash
npm install react react-dom axios
npm install --save-dev vite @vitejs/plugin-react
```

### Port Already in Use
If port 3000 or 5173 is already in use:
- Backend: Edit `backend/.env` and change `PORT=3000` to another port
- Frontend: Edit `frontend/vite.config.js` and change `port: 5173` to another port

### API Connection Issues
Make sure the backend is running before using the frontend. The frontend proxies API requests to `http://localhost:3000`.

## API Testing with curl

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

Test CV analysis (requires a PDF file):
```bash
curl -X POST http://localhost:3000/api/cv/analyze \
  -F "cv=@/path/to/your/cv.pdf"
```

## Production Build

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
# Serve them with any static file server or integrate with backend
```
