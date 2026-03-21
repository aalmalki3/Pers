import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CV file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const response = await axios.post('/api/cv/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data);
    } catch (err) {
      console.error('Error uploading CV:', err);
      setError(err.response?.data?.message || 'Failed to analyze CV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📄 CV Career Advisor</h1>
        <p>Upload your CV and get personalized career path suggestions</p>
      </header>

      <main className="main">
        <section className="upload-section">
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="file-input-wrapper">
              <label htmlFor="cv-upload" className="file-label">
                {file ? file.name : 'Choose a PDF file or drag and drop'}
              </label>
              <input
                id="cv-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !file}
            >
              {loading ? 'Analyzing...' : 'Analyze My CV'}
            </button>
          </form>
        </section>

        {result && (
          <section className="results-section">
            <div className="analysis-card">
              <h2>📊 CV Analysis</h2>
              
              <div className="info-grid">
                <div className="info-item">
                  <h3>Current Role</h3>
                  <p>{result.analysis.currentRole}</p>
                </div>
                
                <div className="info-item">
                  <h3>Seniority Level</h3>
                  <p>{result.analysis.seniority}</p>
                </div>
                
                <div className="info-item">
                  <h3>Experience</h3>
                  <p>
                    {result.analysis.experience.explicitYears 
                      ? `${result.analysis.experience.explicitYears} years`
                      : result.analysis.experience.estimatedYears > 0
                        ? `~${result.analysis.experience.estimatedYears} years`
                        : 'Not specified'
                    }
                  </p>
                </div>
                
                <div className="info-item">
                  <h3>Education</h3>
                  <p>
                    {result.analysis.education.degrees.length > 0
                      ? result.analysis.education.degrees.join(', ')
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>

              <div className="skills-section">
                <h3>💼 Detected Skills</h3>
                <div className="skills-list">
                  {result.analysis.skills.length > 0 ? (
                    result.analysis.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  ) : (
                    <p>No specific skills detected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="suggestions-card">
              <h2>🎯 Career Suggestions</h2>
              
              <div className="suggestions-grid">
                <div className="suggestion-column">
                  <h3>🚀 Recommended Career Paths</h3>
                  <ul className="career-paths">
                    {result.suggestions.careerPaths.length > 0 ? (
                      result.suggestions.careerPaths.map((path, index) => (
                        <li key={index}>{path}</li>
                      ))
                    ) : (
                      <li>No specific paths recommended</li>
                    )}
                  </ul>
                </div>

                <div className="suggestion-column">
                  <h3>📚 Development Points</h3>
                  <ul className="development-points">
                    {result.suggestions.developmentPoints.length > 0 ? (
                      result.suggestions.developmentPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))
                    ) : (
                      <li>No specific development points</li>
                    )}
                  </ul>
                </div>

                <div className="suggestion-column">
                  <h3>⭐ Recommended Skills to Learn</h3>
                  <div className="recommended-skills">
                    {result.suggestions.recommendedSkills.length > 0 ? (
                      result.suggestions.recommendedSkills.map((skill, index) => (
                        <span key={index} className="skill-tag recommended">{skill}</span>
                      ))
                    ) : (
                      <p>Great! You have all the recommended skills</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {!result && !loading && (
          <section className="info-section">
            <h2>How it works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Upload your CV</h3>
                <p>Select a PDF file of your current CV/resume</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>AI Analysis</h3>
                <p>We analyze your skills, experience, and background</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Get Recommendations</h3>
                <p>Receive personalized career paths and development tips</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>CV Career Advisor - Your personal career development assistant</p>
      </footer>
    </div>
  );
}

export default App;
