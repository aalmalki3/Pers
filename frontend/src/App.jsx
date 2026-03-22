import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function App() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // analysis, editor
  const [darkMode, setDarkMode] = useState(false);
  
  // Editor State
  const [cvContent, setCvContent] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const pdfViewerRef = useRef(null);
  const editorRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setError('');
      setResult(null);
      setActiveTab('analysis');
      
      // Reset editor
      setCvContent([
        { id: 1, type: 'header', content: 'Your Name', style: { fontSize: '24px', fontWeight: 'bold', color: '#000000', textAlign: 'center' } },
        { id: 2, type: 'text', content: 'Phone | Email | Location', style: { fontSize: '14px', color: '#333333', textAlign: 'center' } },
        { id: 3, type: 'section', content: 'Professional Experience', style: { fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginTop: '20px' } },
        { id: 4, type: 'text', content: 'Job Title - Company Name\nDates\n- Achievement 1\n- Achievement 2', style: { fontSize: '14px', color: '#333333', lineHeight: '1.5' } }
      ]);
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
      const response = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Failed to upload');
      setResult(data);
      
      // Pre-fill editor with extracted text (simplified)
      const lines = data.rawText.split('\n').filter(l => l.trim().length > 0);
      const newContent = lines.map((line, idx) => ({
        id: idx,
        type: line.length > 50 ? 'text' : 'header',
        content: line,
        style: { 
          fontSize: line.length > 50 ? '14px' : '16px', 
          fontWeight: line.length > 50 ? 'normal' : 'bold',
          color: '#000000',
          marginBottom: '8px'
        }
      }));
      setCvContent(newContent);
      setActiveTab('editor');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = (id, field, value) => {
    setCvContent(prev => prev.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  const updateStyle = (id, styleProp, value) => {
    setCvContent(prev => prev.map(block => 
      block.id === id ? { ...block, style: { ...block.style, [styleProp]: value } } : block
    ));
  };

  const addBlock = () => {
    const newId = Math.max(...cvContent.map(b => b.id), 0) + 1;
    setCvContent([...cvContent, { id: newId, type: 'text', content: 'New Section', style: { fontSize: '14px', color: '#000000', marginBottom: '8px' } }]);
  };

  const downloadPDF = () => {
    const element = editorRef.current;
    const opt = {
      margin: 10,
      filename: 'updated-cv.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // Styles
  const theme = {
    bg: darkMode ? '#1a202c' : '#f7fafc',
    card: darkMode ? '#2d3748' : '#ffffff',
    text: darkMode ? '#e2e8f0' : '#2d3748',
    textSec: darkMode ? '#a0aec0' : '#718096',
    border: darkMode ? '#4a5568' : '#e2e8f0',
    primary: '#3182ce'
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'system-ui, sans-serif', transition: 'all 0.3s' }}>
      {/* Header */}
      <header style={{ background: theme.card, borderBottom: `1px solid ${theme.border}`, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>CV Career Advisor</h1>
          <p style={{ fontSize: '0.875rem', color: theme.textSec, margin: 0 }}>ATS Analysis & Smart Editor</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {result && (
            <>
              <button onClick={() => setActiveTab('analysis')} style={{ padding: '0.5rem 1rem', background: activeTab === 'analysis' ? theme.primary : 'transparent', color: activeTab === 'analysis' ? '#fff' : theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Analysis</button>
              <button onClick={() => setActiveTab('editor')} style={{ padding: '0.5rem 1rem', background: activeTab === 'editor' ? theme.primary : 'transparent', color: activeTab === 'editor' ? '#fff' : theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Visual Editor</button>
            </>
          )}
          <button onClick={toggleTheme} style={{ padding: '0.5rem', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '50%', cursor: 'pointer', color: theme.text }} title="Toggle Theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {!result ? (
          /* Upload View */
          <div style={{ background: theme.card, border: `2px dashed ${theme.border}`, borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Upload your CV to start</h2>
            <p style={{ color: theme.textSec, marginBottom: '2rem' }}>Get instant ATS analysis and edit your CV visually.</p>
            <input type="file" accept=".pdf" onChange={handleFileChange} style={{ marginBottom: '1.5rem' }} />
            <br />
            <button onClick={handleUpload} disabled={!file || loading} style={{ padding: '0.75rem 2rem', background: loading ? '#9ca3af' : theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Analyzing...' : 'Analyze CV'}
            </button>
            {error && <div style={{ marginTop: '1rem', color: '#fc8181', background: '#742a2a', padding: '1rem', borderRadius: '6px' }}>{error}</div>}
          </div>
        ) : (
          /* Results View */
          <div>
            {activeTab === 'analysis' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Score Card */}
                <div style={{ background: theme.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>ATS Alignment Score</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: result.issues.length === 0 ? '#48bb78' : '#f56565' }}>
                    {Math.max(0, 100 - (result.issues.length * 10))}%
                  </div>
                  <p style={{ color: theme.textSec }}>Based on 10 key standards</p>
                </div>
                
                {/* Issues */}
                <div style={{ background: theme.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.border}`, gridColumn: 'span 1' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#f56565' }}>Issues Detected ({result.issues.length})</h3>
                  {result.issues.length === 0 ? <p>No critical issues found!</p> : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {result.issues.map((issue, idx) => (
                        <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${theme.border}` }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{issue.title}</div>
                          <p style={{ fontSize: '0.875rem', color: theme.textSec }}>{issue.description}</p>
                          <div style={{ marginTop: '0.5rem', background: darkMode ? '#2d3748' : '#ebf8ff', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                            <strong>Fix:</strong> {result.solutions[issue.id]?.[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strengths */}
                <div style={{ background: theme.card, padding: '1.5rem', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#48bb78' }}>Strengths</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {result.strengths.map((str, idx) => (
                      <li key={idx} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#48bb78', marginRight: '0.5rem' }}>✓</span> {str}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: 'calc(100vh - 150px)' }}>
                {/* Left: Original PDF Reference */}
                <div style={{ background: theme.card, borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.border}`, fontWeight: 'bold' }}>Original PDF (Reference)</div>
                  <iframe src={fileUrl} style={{ flex: 1, width: '100%', border: 'none' }} title="Original PDF" />
                </div>

                {/* Right: Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Toolbar */}
                  <div style={{ background: theme.card, padding: '1rem', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={addBlock} style={{ padding: '0.5rem 1rem', background: theme.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Add Section</button>
                    {selectedBlock !== null && (
                      <>
                        <input type="color" value={cvContent.find(b => b.id === selectedBlock)?.style.color || '#000000'} onChange={(e) => updateStyle(selectedBlock, 'color', e.target.value)} title="Text Color" />
                        <select value={cvContent.find(b => b.id === selectedBlock)?.style.fontSize || '14px'} onChange={(e) => updateStyle(selectedBlock, 'fontSize', e.target.value)} style={{ padding: '0.25rem' }}>
                          <option value="12px">Small</option>
                          <option value="14px">Normal</option>
                          <option value="18px">Medium</option>
                          <option value="24px">Large</option>
                        </select>
                        <button onClick={() => setCvContent(prev => prev.filter(b => b.id !== selectedBlock))} style={{ padding: '0.5rem', background: '#fc8181', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                      </>
                    )}
                    <button onClick={downloadPDF} style={{ marginLeft: 'auto', padding: '0.5rem 1.5rem', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Download PDF</button>
                  </div>

                  {/* A4 Canvas */}
                  <div style={{ flex: 1, overflowY: 'auto', background: '#525659', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div ref={editorRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '20mm', boxShadow: '0 0 10px rgba(0,0,0,0.5)', color: '#000' }}>
                      {cvContent.map((block) => (
                        <div key={block.id} onClick={() => setSelectedBlock(block.id)} style={{ 
                          ...block.style, 
                          padding: '4px', 
                          border: selectedBlock === block.id ? '2px solid #3182ce' : '1px solid transparent',
                          cursor: 'text',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <textarea 
                            value={block.content} 
                            onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                            style={{ width: '100%', border: 'none', resize: 'none', font: 'inherit', color: 'inherit', background: 'transparent', outline: 'none', overflow: 'hidden' }}
                            rows={block.content.split('\n').length}
                          />
                        </div>
                      ))}
                    </div>
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
