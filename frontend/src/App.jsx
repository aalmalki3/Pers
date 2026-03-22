import { useState, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [darkMode, setDarkMode] = useState(false);

  // Handle Theme Toggle
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setDarkMode(!darkMode);

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
      if (!response.ok) throw new Error(data.details || 'Failed to upload');
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Alignment Score
  const calculateScore = (issues, strengths) => {
    const totalChecks = issues.length + strengths.length;
    if (totalChecks === 0) return 0;
    return Math.round((strengths.length / totalChecks) * 100);
  };

  const score = result ? calculateScore(result.issues, result.strengths) : 0;
  
  // Dynamic Styles based on Theme
  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.bg, 
      color: theme.text, 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '1.5rem 2rem', 
        borderBottom: `1px solid ${theme.border}`,
        background: theme.cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>CV ATS Analyzer</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: theme.textMuted }}>Professional Gap & Weakness Detector</p>
        </div>
        
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            color: theme.text,
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px'
          }}
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Upload Section */}
        {!result && (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem', 
            border: `2px dashed ${theme.border}`, 
            borderRadius: '12px', 
            background: theme.cardBg 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Upload your CV</h2>
            <p style={{ color: theme.textMuted, marginBottom: '2rem' }}>Supports PDF. Instant ATS analysis.</p>
            
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              style={{ marginBottom: '1.5rem' }}
            />
            <br />
            <button 
              onClick={handleUpload} 
              disabled={!file || loading}
              style={{ 
                padding: '12px 32px', 
                background: loading ? theme.textMuted : theme.primary, 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze CV'}
            </button>
            {error && <p style={{ color: theme.danger, marginTop: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            
            {/* Score Card */}
            <div style={{ 
              background: theme.cardBg, 
              padding: '2rem', 
              borderRadius: '12px', 
              marginBottom: '2rem',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>Analysis Complete</h2>
                <p style={{ color: theme.textMuted, margin: 0 }}>File: {result.fileName}</p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.danger }}>
                  {score}%
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ATS Alignment Score
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'issues', label: `Issues (${result.issues.length})`, icon: '⚠️' },
                { id: 'strengths', label: `Strengths (${result.strengths.length})`, icon: '✅' },
                { id: 'raw', label: 'Raw Text', icon: '📝' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px',
                    background: activeTab === tab.id ? theme.primary : theme.cardBg,
                    color: activeTab === tab.id ? 'white' : theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ 
              background: theme.cardBg, 
              padding: '2rem', 
              borderRadius: '12px', 
              border: `1px solid ${theme.border}`,
              minHeight: '400px'
            }}>
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div>
                  <h3 style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem', marginBottom: '1.5rem' }}>Executive Summary</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: darkMode ? '#064e3b' : '#ecfdf5', borderRadius: '8px', borderLeft: `4px solid ${theme.success}` }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: theme.success }}>Strengths</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{result.strengths.length} areas align with ATS standards.</p>
                    </div>
                    <div style={{ padding: '1.5rem', background: darkMode ? '#450a0a' : '#fef2f2', borderRadius: '8px', borderLeft: `4px solid ${theme.danger}` }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: theme.danger }}>Critical Issues</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{result.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length} high-priority fixes needed.</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Top Recommendation</h4>
                    {result.issues.length > 0 ? (
                      <div style={{ padding: '1.5rem', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                        <strong style={{ color: theme.danger }}>{result.issues[0].title}</strong>
                        <p style={{ margin: '0.5rem 0', color: theme.textMuted }}>{result.issues[0].description}</p>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                          {result.solutions[result.issues[0].id]?.slice(0, 2).map((sol, i) => (
                            <li key={i} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{sol}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p style={{ color: theme.success }}>No critical issues found! Your CV is well optimized.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ISSUES TAB */}
              {activeTab === 'issues' && (
                <div>
                  {result.issues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: theme.success }}>
                      <div style={{ fontSize: '3rem' }}>🎉</div>
                      <h3>No Issues Found!</h3>
                      <p>Your CV passes all checked ATS criteria.</p>
                    </div>
                  ) : (
                    result.issues.map((issue, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '1.5rem', 
                        paddingBottom: '1.5rem', 
                        borderBottom: `1px solid ${theme.border}`,
                        lastChild: { borderBottom: 'none' }
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                          <span style={{ 
                            fontSize: '1.5rem',
                            color: issue.severity === 'critical' ? theme.danger : issue.severity === 'high' ? theme.warning : theme.textMuted
                          }}>
                            {issue.severity === 'critical' ? '🛑' : issue.severity === 'high' ? '⚠️' : 'ℹ️'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{issue.title}</h3>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                background: theme.border, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: '600'
                              }}>{issue.category}</span>
                            </div>
                            <p style={{ color: theme.textMuted, margin: '0.5rem 0 1rem 0' }}>{issue.description}</p>
                            
                            <div style={{ 
                              background: darkMode ? '#1e3a8a' : '#eff6ff', 
                              padding: '1rem', 
                              borderRadius: '8px',
                              border: `1px solid ${darkMode ? '#1e40af' : '#dbeafe'}`
                            }}>
                              <strong style={{ display: 'block', marginBottom: '0.75rem', color: theme.primary }}>💡 How to fix:</strong>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                                {result.solutions[issue.id]?.map((sol, sIdx) => (
                                  <li key={sIdx} style={{ marginBottom: '0.5rem' }}>{sol}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STRENGTHS TAB */}
              {activeTab === 'strengths' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {result.strengths.map((str, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      background: darkMode ? '#064e3b' : '#ecfdf5', 
                      borderLeft: `4px solid ${theme.success}`, 
                      borderRadius: '8px' 
                    }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '1rem' }}>✅</span>
                      <span style={{ fontWeight: '500' }}>{str}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* RAW TEXT TAB */}
              {activeTab === 'raw' && (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.85rem', 
                  color: theme.textMuted, 
                  background: theme.bg, 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {result.rawText}
                </pre>
              )}
            </div>
            
            {/* Reset Button */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                onClick={() => { setResult(null); setFile(null); }}
                style={{
                  background: 'transparent',
                  color: theme.textMuted,
                  border: `1px solid ${theme.border}`,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Analyze Another CV
              </button>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
