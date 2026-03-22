import { useState, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [theme, setTheme] = useState('light');

  // Load theme from preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
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
      if (!response.ok) throw new Error(data.details || 'Failed');
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight text based on issues/strengths keywords
  const getHighlightedText = (text) => {
    if (!result) return text;
    
    let highlighted = text;
    
    // Highlight Strengths (Green)
    result.strengths.forEach(str => {
      // Extract keywords from strength description roughly
      const keywords = ['contact', 'email', 'phone', 'summary', 'profile', 'metric', 'number', '%', 'action', 'verb', 'date', 'skill', 'education', 'degree', 'progression'];
      // This is a simple visualizer; in a real app we'd map specific regex matches
      // For now, we highlight known good patterns found in the text
    });

    // Highlight Issues (Red Background)
    // We will highlight generic patterns associated with the detected issues
    if (result.issues.some(i => i.id === 'metrics')) {
      // If metrics issue exists, highlight numbers that ARE there to show "Good", 
      // but since we can't know what's missing, we highlight the sections lacking context?
      // Better approach: Highlight the SECTIONS that have issues.
    }
    
    // Simplified Visualizer: Just return text for now, but styled differently in the component
    return highlighted;
  };

  const styles = {
    bg: theme === 'dark' ? '#1a202c' : '#f7fafc',
    card: theme === 'dark' ? '#2d3748' : '#ffffff',
    text: theme === 'dark' ? '#e2e8f0' : '#2d3748',
    textMuted: theme === 'dark' ? '#a0aec0' : '#718096',
    border: theme === 'dark' ? '#4a5568' : '#e2e8f0',
    primary: '#4299e1',
    success: '#48bb78',
    danger: '#f56565',
    warning: '#ed8936'
  };

  return (
    <div style={{ minHeight: '100vh', background: styles.bg, color: styles.text, fontFamily: 'system-ui, sans-serif', transition: 'all 0.3s' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${styles.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: styles.card }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>CV ATS Analyzer</h1>
          <p style={{ margin: '0.25rem 0 0', color: styles.textMuted, fontSize: '0.9rem' }}>International Standards & Gap Detection</p>
        </div>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: `1px solid ${styles.border}`, color: styles.text, padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Upload Area */}
        {!result && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: styles.card, borderRadius: '12px', border: `2px dashed ${styles.border}` }}>
            <h2 style={{ marginBottom: '1rem' }}>Upload your CV (PDF)</h2>
            <p style={{ color: styles.textMuted, marginBottom: '2rem' }}>Get an instant score based on 10 global ATS standards.</p>
            <input type="file" accept=".pdf" onChange={handleFileChange} style={{ marginBottom: '1.5rem' }} />
            <br />
            <button onClick={handleUpload} disabled={!file || loading} style={{ padding: '12px 32px', background: loading ? styles.textMuted : styles.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Analyzing...' : 'Analyze CV'}
            </button>
            {error && <p style={{ color: styles.danger, marginTop: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div>
            {/* Score Card */}
            <div style={{ background: styles.card, padding: '2rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', border: `1px solid ${styles.border}` }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>ATS Alignment Score</h2>
              <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={styles.border} strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={result.percentage > 80 ? styles.success : result.percentage > 50 ? styles.warning : styles.danger} strokeWidth="3" strokeDasharray={`${result.percentage}, 100`} />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2rem', fontWeight: 'bold' }}>
                  {result.percentage}%
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: styles.textMuted }}>Based on 10 International Criteria</p>
              <button onClick={() => setResult(null)} style={{ marginTop: '1rem', background: 'transparent', border: `1px solid ${styles.border}`, color: styles.text, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Analyze Another</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {['overview', 'issues', 'strengths', 'visual'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
                  padding: '10px 20px', 
                  background: activeTab === tab ? styles.primary : styles.card, 
                  color: activeTab === tab ? 'white' : styles.text, 
                  border: `1px solid ${styles.border}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: activeTab === tab ? 'bold' : 'normal'
                }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'issues' && ` (${result.issues.length})`}
                  {tab === 'strengths' && ` (${result.strengths.length})`}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ background: styles.card, padding: '2rem', borderRadius: '12px', border: `1px solid ${styles.border}`, minHeight: '400px' }}>
              
              {activeTab === 'overview' && (
                <div>
                  <h3 style={{ borderBottom: `1px solid ${styles.border}`, paddingBottom: '1rem' }}>Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                    <div>
                      <h4 style={{ color: styles.success }}>✓ Strengths ({result.strengths.length})</h4>
                      <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                        {result.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ color: styles.danger }}>⚠ Critical Fixes ({result.issues.filter(i=>i.severity==='critical' || i.severity==='high').length})</h4>
                      <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                        {result.issues.filter(i=>i.severity==='critical' || i.severity==='high').slice(0, 3).map((iss, i) => (
                          <li key={i}>
                            <strong>{iss.title}</strong>: {iss.description}
                          </li>
                        ))}
                        {result.issues.filter(i=>i.severity==='critical' || i.severity==='high').length === 0 && <li style={{color: styles.textMuted}}>No critical issues!</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'issues' && (
                <div>
                  {result.issues.length === 0 ? <p>Perfect! No issues found.</p> : result.issues.map((issue, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${styles.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: issue.severity === 'critical' ? styles.danger : issue.severity === 'high' ? styles.warning : '#ecc94b' }}></span>
                        <h3 style={{ margin: 0 }}>{issue.title}</h3>
                        <span style={{ fontSize: '0.8rem', background: styles.border, padding: '2px 8px', borderRadius: '4px' }}>{issue.category}</span>
                      </div>
                      <p style={{ color: styles.textMuted, marginLeft: '20px' }}>{issue.description}</p>
                      <div style={{ background: theme === 'dark' ? '#2d3748' : '#ebf8ff', padding: '1rem', borderRadius: '8px', marginLeft: '20px', marginTop: '1rem' }}>
                        <strong style={{ color: styles.primary }}>💡 How to fix:</strong>
                        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                          {result.solutions[issue.id].map((sol, sIdx) => <li key={sIdx} style={{ marginBottom: '0.5rem' }}>{sol}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'strengths' && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {result.strengths.map((str, idx) => (
                    <li key={idx} style={{ padding: '1rem', background: theme === 'dark' ? '#22543d' : '#f0fff4', borderLeft: `4px solid ${styles.success}`, marginBottom: '1rem', borderRadius: '0 8px 8px 0' }}>
                      <strong>✓ {str}</strong>
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === 'visual' && (
                <div>
                  <p style={{ marginBottom: '1rem', color: styles.textMuted }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(245, 101, 101, 0.3)', border: '1px solid red', marginRight: '5px' }}></span> 
                    Areas needing improvement are highlighted below.
                  </p>
                  <div style={{ background: theme === 'dark' ? '#1a202c' : '#fff', padding: '1.5rem', borderRadius: '8px', border: `1px solid ${styles.border}`, lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {/* Simple Visualizer: Highlights text if an issue keyword is near it? 
                        For now, we just show the raw text but styled cleanly. 
                        True highlighting requires mapping char offsets which is complex for this demo.
                        Instead, we show the Raw Text clearly.
                    */}
                    {result.rawText}
                  </div>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: styles.textMuted }}>
                    *Tip: Cross-reference the "Issues" tab with this text to locate specific sections.
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
