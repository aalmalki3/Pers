import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

// --- Icons ---
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // analysis, editor
  const [darkMode, setDarkMode] = useState(false);
  
  // Editor State
  const [cvData, setCvData] = useState({
    header: { name: '', title: '', contact: '' },
    summary: '',
    experience: [],
    education: [],
    skills: []
  });
  const [styles, setStyles] = useState({
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#2c3e50',
    textColor: '#333333',
    fontSize: '14px'
  });

  const pdfRef = useRef();

  // Toggle Theme
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

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
      const response = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Failed to upload');
      
      setResult(data);
      parseCVText(data.rawText); // Auto-populate editor
      setActiveTab('analysis');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simple Heuristic Parser to Reconstruct Structure
  const parseCVText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Detect Header (First few non-empty lines usually)
    const name = lines[0] || '';
    const title = lines[1] || '';
    const contact = lines[2] || '';

    // Detect Sections
    let currentSection = 'summary';
    const experience = [];
    const education = [];
    const skills = [];
    let summary = '';
    let buffer = [];

    const sectionKeywords = {
      'experience': ['experience', 'work history', 'employment'],
      'education': ['education', 'academic'],
      'skills': ['skills', 'competencies', 'languages'],
      'summary': ['summary', 'profile', 'about']
    };

    lines.forEach(line => {
      const lower = line.toLowerCase();
      let foundSection = null;

      // Check if line is a section header
      Object.keys(sectionKeywords).forEach(key => {
        if (sectionKeywords[key].some(k => lower.includes(k) && lower.length < 30)) {
          foundSection = key;
        }
      });

      if (foundSection) {
        // Save previous buffer to previous section
        if (currentSection === 'experience' && buffer.length > 0) experience.push(buffer.join('\n'));
        if (currentSection === 'education' && buffer.length > 0) education.push(buffer.join('\n'));
        if (currentSection === 'skills' && buffer.length > 0) skills.push(buffer.join('\n'));
        if (currentSection === 'summary' && buffer.length > 0) summary = buffer.join(' ');
        
        currentSection = foundSection;
        buffer = [];
      } else {
        buffer.push(line);
      }
    });
    // Push final buffer
    if (currentSection === 'experience' && buffer.length > 0) experience.push(buffer.join('\n'));
    if (currentSection === 'summary' && buffer.length > 0) summary = buffer.join(' ');

    setCvData({
      header: { name, title, contact },
      summary,
      experience,
      education,
      skills
    });
  };

  const downloadPDF = () => {
    const element = pdfRef.current;
    const opt = {
      margin: 0,
      filename: 'edited-cv.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const updateStyle = (key, value) => setStyles({ ...styles, [key]: value });

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>CV Career Advisor</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {result && (
            <>
              <button onClick={() => setActiveTab('analysis')} style={{ background: activeTab === 'analysis' ? '#007bff' : 'transparent', color: activeTab === 'analysis' ? '#fff' : '#333', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Analysis</button>
              <button onClick={() => setActiveTab('editor')} style={{ background: activeTab === 'editor' ? '#007bff' : 'transparent', color: activeTab === 'editor' ? '#fff' : '#333', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Visual Editor</button>
              <button onClick={downloadPDF} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><DownloadIcon /> Download PDF</button>
            </>
          )}
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'transparent', border: '1px solid #ccc', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed #ccc', borderRadius: '8px' }}>
            <h2>Upload your CV to start</h2>
            <input type="file" accept=".pdf" onChange={handleFileChange} style={{ margin: '1rem 0' }} />
            <br />
            <button onClick={handleUpload} disabled={!file || loading} style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {loading ? 'Processing...' : 'Analyze CV'}
            </button>
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
          </div>
        ) : (
          <>
            {activeTab === 'analysis' && (
              <div className="analysis-view">
                <h2>Analysis Results</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h3>Strengths</h3>
                    <ul>{result.strengths.map((s, i) => <li key={i} style={{color: 'green'}}>{s}</li>)}</ul>
                  </div>
                  <div>
                    <h3>Issues & Fixes</h3>
                    {result.issues.map((issue, i) => (
                      <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
                        <strong>{issue.title}</strong>
                        <p>{issue.description}</p>
                        <ul>{result.solutions[issue.id]?.map((sol, j) => <li key={j}>{sol}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="editor-view" style={{ display: 'flex', gap: '2rem', flexDirection: 'row' }}>
                {/* Controls Sidebar */}
                <div style={{ flex: '0 0 250px', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', height: 'fit-content' }}>
                  <h3>Style Controls</h3>
                  <label style={{display:'block', marginBottom:'0.5rem'}}>Font Family</label>
                  <select value={styles.fontFamily} onChange={(e) => updateStyle('fontFamily', e.target.value)} style={{width:'100%', padding:'5px', marginBottom:'1rem'}}>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Calibri', sans-serif">Calibri</option>
                    <option value="'Georgia', serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier New</option>
                  </select>

                  <label style={{display:'block', marginBottom:'0.5rem'}}>Primary Color</label>
                  <input type="color" value={styles.primaryColor} onChange={(e) => updateStyle('primaryColor', e.target.value)} style={{width:'100%', height:'40px', marginBottom:'1rem'}} />

                  <label style={{display:'block', marginBottom:'0.5rem'}}>Text Size</label>
                  <input type="range" min="10" max="18" value={parseInt(styles.fontSize)} onChange={(e) => updateStyle('fontSize', `${e.target.value}px`)} style={{width:'100%', marginBottom:'1rem'}} />
                  
                  <p style={{fontSize:'0.8rem', color:'#666'}}>Tip: Click any text below to edit it directly.</p>
                </div>

                {/* A4 Preview Area */}
                <div style={{ flex: 1, overflow: 'auto', background: '#555', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <div 
                    ref={pdfRef}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      background: 'white',
                      padding: '20mm',
                      boxSizing: 'border-box',
                      fontFamily: styles.fontFamily,
                      fontSize: styles.fontSize,
                      color: styles.textColor,
                      outline: 'none',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                    }}
                  >
                    {/* Editable Content Structure */}
                    <div style={{ textAlign: 'center', borderBottom: `2px solid ${styles.primaryColor}`, paddingBottom: '10px', marginBottom: '20px' }}>
                      <h1 style={{ margin: 0, color: styles.primaryColor, fontSize: '1.5em' }}>{cvData.header.name}</h1>
                      <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{cvData.header.title}</p>
                      <p style={{ margin: 0, fontSize: '0.9em' }}>{cvData.header.contact}</p>
                    </div>

                    {cvData.summary && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: styles.primaryColor, textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Professional Summary</h3>
                        <p>{cvData.summary}</p>
                      </div>
                    )}

                    {cvData.experience.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: styles.primaryColor, textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Experience</h3>
                        {cvData.experience.map((exp, i) => (
                          <div key={i} style={{ marginBottom: '15px' }}>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{exp}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {cvData.education.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: styles.primaryColor, textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Education</h3>
                        {cvData.education.map((edu, i) => (
                          <div key={i} style={{ marginBottom: '10px' }}>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{edu}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {cvData.skills.length > 0 && (
                      <div>
                        <h3 style={{ color: styles.primaryColor, textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>Skills</h3>
                        <p>{cvData.skills.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; transition: background 0.3s, color 0.3s; }
        .app-container.light { background: #f4f6f8; color: #333; }
        .app-container.dark { background: #1a1a1a; color: #f0f0f0; }
        .app-container.dark header { border-color: #444; background: #2d2d2d; }
        .app-container.dark .analysis-view h3 { color: #fff; }
        .app-container.dark button { color: #fff; }
        .app-container.dark button:not([style*="background: #"]) { background: #444 !important; }
      `}</style>
    </div>
  );
}

export default App;
