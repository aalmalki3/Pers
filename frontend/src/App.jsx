import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { pdfjs } from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, editor
  const [darkMode, setDarkMode] = useState(false);
  
  // Editor State
  const [cvData, setCvData] = useState({
    header: { name: '', title: '', contact: '' },
    summary: '',
    experience: [],
    education: [],
    skills: []
  });

  // Theme Toggle
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.style.background = darkMode ? '#ffffff' : '#f3f4f6';
    document.body.style.color = darkMode ? '#1f2937' : '#ffffff';
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile));
      setAnalysis(null);
      setActiveTab('dashboard');
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const res = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data);
        // Auto-populate editor with extracted text (Simple heuristic)
        setCvData(prev => ({
          ...prev,
          summary: data.rawText.split('SUMMARY')[1]?.split('EXPERIENCE')[0]?.trim() || '',
          // In a real app, we'd parse experience/education more deeply here
        }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = document.getElementById('cv-preview');
    const opt = {
      margin: 0,
      filename: 'edited-cv.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // --- Render Helpers ---
  const renderSection = (title, items) => (
    <div style={{ marginBottom: '15px' }}>
      <h3 style={{ borderBottom: '2px solid #2563eb', paddingBottom: '5px', color: '#1e3a8a', fontSize: '14px', textTransform: 'uppercase' }}>{title}</h3>
      {items.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '10px' }}>
          <textarea 
            value={item} 
            onChange={(e) => {
              const newItems = [...items];
              newItems[idx] = e.target.value;
              // Logic to update state would go here (simplified for demo)
            }}
            style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', outline: 'none' }}
            rows={Math.max(2, item.split('\n').length)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`} style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: darkMode ? '#111827' : '#f3f4f6', color: darkMode ? '#f9fafb' : '#1f2937', transition: 'all 0.3s ease' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: darkMode ? '#1f2937' : '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>CV</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Career Advisor Pro</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {analysis && (
            <nav style={{ display: 'flex', gap: '5px', background: darkMode ? '#374151' : '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setActiveTab('dashboard')} style={{ padding: '6px 12px', border: 'none', background: activeTab === 'dashboard' ? '#ffffff' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'dashboard' ? '600' : '400', color: activeTab === 'dashboard' ? '#2563eb' : 'inherit' }}>Analysis</button>
              <button onClick={() => setActiveTab('editor')} style={{ padding: '6px 12px', border: 'none', background: activeTab === 'editor' ? '#ffffff' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === 'editor' ? '600' : '400', color: activeTab === 'editor' ? '#2563eb' : 'inherit' }}>Visual Editor</button>
            </nav>
          )}
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid currentColor', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {!analysis ? (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Upload your CV to start</h2>
            <p style={{ marginBottom: '2rem', opacity: 0.7 }}>ATS Analysis, Gap Detection & Smart Editing</p>
            <label style={{ display: 'inline-block', padding: '1rem 2rem', background: '#2563eb', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s' }}>
              Select PDF File
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {loading && <p style={{ marginTop: '1rem' }}>Analyzing document...</p>}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Score Card */}
                <div style={{ background: darkMode ? '#1f2937' : '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: analysis.issues.length === 0 ? '#10b981' : '#f59e0b' }}>
                    {Math.max(0, 100 - (analysis.issues.length * 10))}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>ATS Alignment Score</div>
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <span style={{ color: '#10b981' }}>✓ {analysis.strengths.length} Strengths</span>
                    <span style={{ color: '#ef4444' }}>✕ {analysis.issues.length} Issues</span>
                  </div>
                </div>

                {/* Issues List */}
                <div style={{ gridColumn: 'span 1 / -1', background: darkMode ? '#1f2937' : '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'), paddingBottom: '0.5rem' }}>Detected Issues & Fixes</h3>
                  {analysis.issues.length === 0 ? (
                    <p style={{ color: '#10b981' }}>No critical issues found! Your CV is well optimized.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                      {analysis.issues.map((issue, idx) => (
                        <div key={idx} style={{ borderLeft: '4px solid ' + (issue.severity === 'critical' ? '#ef4444' : '#f59e0b'), paddingLeft: '1rem' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{issue.title}</h4>
                          <p style={{ opacity: 0.8, fontSize: '0.95rem' }}>{issue.description}</p>
                          <div style={{ marginTop: '0.75rem', background: darkMode ? '#111827' : '#f9fafb', padding: '0.75rem', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#2563eb' }}>💡 Fix:</strong>
                            <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.9rem' }}>
                              {analysis.solutions[issue.id]?.map((sol, sIdx) => <li key={sIdx}>{sol}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', height: 'calc(100vh - 150px)' }}>
                {/* Left: Original Reference */}
                <div style={{ background: darkMode ? '#1f2937' : '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid ' + (darkMode ? '#374151' : '#e5e7eb'), fontWeight: '600' }}>Original PDF (Reference)</div>
                  <iframe src={pdfUrl} style={{ flex: 1, border: 'none', width: '100%' }} title="Original PDF" />
                </div>

                {/* Right: Live Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Live Editor (A4)</h3>
                    <button onClick={downloadPDF} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Download PDF</button>
                  </div>
                  
                  <div style={{ flex: 1, overflow: 'auto', background: '#525659', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                    {/* A4 Paper Simulation */}
                    <div id="cv-preview" style={{ 
                      width: '210mm', 
                      minHeight: '297mm', 
                      background: 'white', 
                      color: '#333', 
                      padding: '20mm', 
                      boxSizing: 'border-box', 
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '11pt',
                      lineHeight: '1.5'
                    }}>
                      {/* Editable Header */}
                      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                        <input 
                          defaultValue={analysis.rawText.split('\n')[0] || 'YOUR NAME'} 
                          style={{ width: '100%', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', border: 'none', outline: 'none', marginBottom: '5px' }} 
                        />
                        <input 
                          defaultValue="Professional Title" 
                          style={{ width: '100%', textAlign: 'center', fontSize: '14px', color: '#555', border: 'none', outline: 'none' }} 
                        />
                        <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                          <input defaultValue="email@example.com | +1 234 567 890" style={{ width: '100%', textAlign: 'center', border: 'none', outline: 'none', background: 'transparent' }} />
                        </div>
                      </div>

                      {/* Editable Summary */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: '12px', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>Professional Summary</h4>
                        <textarea 
                          defaultValue={cvData.summary} 
                          style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 'inherit', minHeight: '80px' }} 
                        />
                      </div>

                      {/* Editable Experience (Static Demo Structure) */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ textTransform: 'uppercase', fontSize: '12px', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>Experience</h4>
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <input defaultValue="Job Title" style={{ border: 'none', outline: 'none', fontWeight: 'bold', width: '50%' }} />
                            <input defaultValue="Date Range" style={{ border: 'none', outline: 'none', textAlign: 'right' }} />
                          </div>
                          <input defaultValue="Company Name" style={{ border: 'none', outline: 'none', fontStyle: 'italic', width: '100%', marginBottom: '5px' }} />
                          <textarea defaultValue="- Achieved X% growth..." style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 'inherit' }} rows={3} />
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center', color: '#999', fontSize: '10px', marginTop: '20px' }}>
                        * Click on any text above to edit. Layout is fixed to A4.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
