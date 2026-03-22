import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis', 'editor', 'raw'
  const [theme, setTheme] = useState('light');
  
  // Editor State
  const [cvContent, setCvContent] = useState('');
  const cvRef = useRef(null);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
      setActiveTab('analysis');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Failed to upload');
      
      setResult(data);
      setCvContent(data.rawText); // Load raw text into editor
      setActiveTab('analysis');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = cvRef.current;
    const opt = {
      margin:       [10, 10, 10, 10], // mm
      filename:     'edited-cv.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Use html2pdf to convert the DOM element to PDF
    html2pdf().set(opt).from(element).save();
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#dc3545';
    if (severity === 'high') return '#fd7e14';
    return '#ffc107';
  };

  const themeStyles = theme === 'dark' 
    ? { bg: '#1a202c', text: '#f7fafc', card: '#2d3748', border: '#4a5568' }
    : { bg: '#f3f4f6', text: '#1f2937', card: '#ffffff', border: '#e5e7eb' };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: themeStyles.bg, 
      color: themeStyles.text, 
      fontFamily: 'system-ui, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '1.5rem 2rem', 
        borderBottom: `1px solid ${themeStyles.border}`,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: themeStyles.card
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>CV Career Advisor</h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.7, fontSize: '0.9rem' }}>Analyze, Edit, and Optimize your CV</p>
        </div>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: `1px solid ${themeStyles.border}`,
            color: themeStyles.text,
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Upload Section */}
        {!result && (
          <div style={{ 
            border: `2px dashed ${themeStyles.border}`, 
            padding: '3rem', 
            textAlign: 'center', 
            borderRadius: '12px', 
            background: themeStyles.card 
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Upload your CV (PDF)</h2>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              style={{ marginBottom: '1.5rem', fontSize: '1rem' }} 
            />
            <br />
            <button 
              onClick={handleUpload} 
              disabled={!file || loading}
              style={{ 
                padding: '12px 32px', 
                background: loading ? '#9ca3af' : '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            color: '#fee2e2', 
            background: '#991b1b', 
            padding: '1rem', 
            borderRadius: '8px' 
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Dashboard */}
        {result && (
          <div>
            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              borderBottom: `1px solid ${themeStyles.border}`,
              paddingBottom: '0.5rem'
            }}>
              <button 
                onClick={() => setActiveTab('analysis')}
                style={{ 
                  padding: '8px 16px', 
                  background: activeTab === 'analysis' ? '#2563eb' : 'transparent', 
                  color: activeTab === 'analysis' ? 'white' : themeStyles.text, 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: activeTab === 'analysis' ? 'bold' : 'normal'
                }}
              >
                📊 Analysis & Gaps
              </button>
              <button 
                onClick={() => setActiveTab('editor')}
                style={{ 
                  padding: '8px 16px', 
                  background: activeTab === 'editor' ? '#2563eb' : 'transparent', 
                  color: activeTab === 'editor' ? 'white' : themeStyles.text, 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: activeTab === 'editor' ? 'bold' : 'normal'
                }}
              >
                ✏️ Visual Editor
              </button>
            </div>

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Issues */}
                <div style={{ background: themeStyles.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${themeStyles.border}` }}>
                  <h3 style={{ marginTop: 0, color: '#ef4444' }}>⚠️ Issues & Gaps</h3>
                  {result.issues.length === 0 ? (
                    <p>No critical issues found!</p>
                  ) : (
                    result.issues.map((issue, idx) => (
                      <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${themeStyles.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: getSeverityColor(issue.severity), 
                            marginRight: '10px' 
                          }}></span>
                          <strong>{issue.title}</strong>
                        </div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{issue.description}</p>
                        <div style={{ background: theme === 'dark' ? '#2d3748' : '#eff6ff', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                          <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>💡 Fix:</strong>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                            {result.solutions[issue.id]?.map((sol, sIdx) => (
                              <li key={sIdx} style={{ marginBottom: '0.25rem' }}>{sol}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Strengths */}
                <div style={{ background: themeStyles.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${themeStyles.border}` }}>
                  <h3 style={{ marginTop: 0, color: '#10b981' }}>✅ Strengths</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {result.strengths.map((str, idx) => (
                      <li key={idx} style={{ 
                        padding: '0.75rem', 
                        background: theme === 'dark' ? '#064e3b' : '#ecfdf5', 
                        borderLeft: '4px solid #10b981', 
                        marginBottom: '0.75rem',
                        borderRadius: '0 4px 4px 0'
                      }}>
                        {str}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Alignment Score */}
                  <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: result.issues.length < 3 ? '#10b981' : '#f59e0b' }}>
                      {Math.max(0, 100 - (result.issues.length * 10))}%
                    </div>
                    <div style={{ opacity: 0.7 }}>ATS Alignment Score</div>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Editor Tab */}
            {activeTab === 'editor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* Controls */}
                <div style={{ background: themeStyles.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${themeStyles.border}` }}>
                  <h3 style={{ marginTop: 0 }}>Editor Controls</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}>
                    Edit the text directly on the A4 preview on the right. Changes save automatically.
                  </p>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Font Family</label>
                    <select 
                      onChange={(e) => {
                        if(cvRef.current) cvRef.current.style.fontFamily = e.target.value;
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${themeStyles.border}` }}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Text Color</label>
                    <input 
                      type="color" 
                      defaultValue="#000000"
                      onChange={(e) => {
                        if(cvRef.current) cvRef.current.style.color = e.target.value;
                      }}
                      style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Background Color</label>
                    <input 
                      type="color" 
                      defaultValue="#ffffff"
                      onChange={(e) => {
                        if(cvRef.current) cvRef.current.style.background = e.target.value;
                      }}
                      style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }}
                    />
                  </div>

                  <button 
                    onClick={downloadPDF}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#059669', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '1rem'
                    }}
                  >
                    📥 Download PDF
                  </button>
                </div>

                {/* A4 Preview Area */}
                <div style={{ 
                  background: '#525659', 
                  padding: '2rem', 
                  borderRadius: '12px', 
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div 
                    ref={cvRef}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      padding: '20mm',
                      background: 'white',
                      color: 'black',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '11pt',
                      lineHeight: '1.5',
                      outline: 'none',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {cvContent}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
