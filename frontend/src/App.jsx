import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Default to 'strengths' tab for a positive first impression
  const [activeTab, setActiveTab] = useState('strengths'); 

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
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Failed to upload');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#dc3545';
    if (severity === 'high') return '#fd7e14';
    return '#ffc107';
  };

  // Calculate a simple alignment score
  const totalChecks = (result?.issues.length || 0) + (result?.strengths.length || 0);
  const alignmentScore = totalChecks > 0 
    ? Math.round(((result?.strengths.length || 0) / totalChecks) * 100) 
    : 0;

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', color: '#333' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#2c3e50' }}>CV Career Advisor</h1>
        <p style={{ color: '#666' }}>ATS Compatibility & Career Gap Analysis</p>
      </header>

      {/* Upload Section */}
      <div style={{ border: '2px dashed #cbd5e0', padding: '2rem', textAlign: 'center', borderRadius: '8px', background: '#f8fafc' }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ marginBottom: '1rem' }} />
        <br />
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          style={{ 
            padding: '12px 24px', 
            background: loading ? '#9ca3af' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Analyzing CV...' : 'Analyze CV'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '1rem', color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '6px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Analysis: {result.fileName}</h2>
            
            {/* Alignment Score Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>ATS Alignment:</span>
              <div style={{ 
                background: alignmentScore > 70 ? '#d1fae5' : alignmentScore > 40 ? '#fef3c7' : '#fee2e2',
                color: alignmentScore > 70 ? '#065f46' : alignmentScore > 40 ? '#92400e' : '#991b1b',
                padding: '6px 16px', 
                borderRadius: '20px', 
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                {alignmentScore}% Match
              </div>
            </div>
          </div>

          {/* Tabs - Strengths First */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('strengths')}
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'strengths' ? '#10b981' : 'transparent', 
                color: activeTab === 'strengths' ? 'white' : '#333', 
                border: 'none', 
                cursor: 'pointer', 
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'strengths' ? 'bold' : 'normal',
                marginRight: '4px'
              }}
            >
              ✓ Strengths & Alignment ({result.strengths.length})
            </button>
            <button 
              onClick={() => setActiveTab('issues')}
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'issues' ? '#ef4444' : 'transparent', 
                color: activeTab === 'issues' ? 'white' : '#333', 
                border: 'none', 
                cursor: 'pointer', 
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'issues' ? 'bold' : 'normal',
                marginRight: '4px'
              }}
            >
              ! Issues & Gaps ({result.issues.length})
            </button>
            <button 
              onClick={() => setActiveTab('raw')}
              style={{ 
                padding: '12px 24px', 
                background: activeTab === 'raw' ? '#64748b' : 'transparent', 
                color: activeTab === 'raw' ? 'white' : '#333', 
                border: 'none', 
                cursor: 'pointer', 
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'raw' ? 'bold' : 'normal',
              }}
            >
              Raw Text
            </button>
          </div>

          {/* Content Area */}
          <div style={{ background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '300px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            
            {/* STRENGTHS TAB */}
            {activeTab === 'strengths' && (
              <div>
                <h3 style={{ color: '#065f46', marginTop: 0 }}>What You're Doing Right</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>Your CV aligns well with ATS standards in the following areas:</p>
                {result.strengths.length === 0 ? (
                  <p>No specific strengths detected yet. Let's fix the issues below!</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {result.strengths.map((str, idx) => (
                      <li key={idx} style={{ 
                        padding: '1rem', 
                        background: '#ecfdf5', 
                        borderLeft: '5px solid #10b981', 
                        marginBottom: '1rem', 
                        color: '#065f46',
                        borderRadius: '0 4px 4px 0'
                      }}>
                        <strong style={{ display: 'block', fontSize: '1.05rem' }}>✓ {str}</strong>
                      </li>
                    ))}
                  </ul>
                )}
                
                {result.issues.length > 0 && (
                  <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => setActiveTab('issues')}
                      style={{ padding: '10px 20px', background: '#fff', border: '2px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      View Areas for Improvement →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ISSUES TAB */}
            {activeTab === 'issues' && (
              <div>
                <h3 style={{ color: '#991b1b', marginTop: 0 }}>Areas for Improvement</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>Fix these issues to increase your ATS alignment score and interview chances.</p>
                
                {result.issues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#065f46' }}>
                    <h3>🎉 Perfect Score!</h3>
                    <p>No critical issues found. Your CV is ready.</p>
                  </div>
                ) : (
                  result.issues.map((issue, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ 
                          width: '14px', height: '14px', borderRadius: '50%', 
                          background: getSeverityColor(issue.severity), 
                          display: 'inline-block' 
                        }}></span>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{issue.title}</h3>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: '#e2e8f0', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#64748b'
                        }}>{issue.category}</span>
                      </div>
                      <p style={{ color: '#555', margin: '0.5rem 0 1rem 24px', lineHeight: '1.5' }}>{issue.description}</p>
                      
                      {/* Solutions Box */}
                      <div style={{ background: '#f0f9ff', padding: '1.2rem', borderRadius: '8px', marginLeft: '24px', border: '1px solid #bae6fd' }}>
                        <strong style={{ display: 'block', marginBottom: '0.8rem', color: '#0369a1', fontSize: '0.9rem', textTransform: 'uppercase' }}>💡 How to Fix:</strong>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                          {result.solutions[issue.id]?.map((sol, sIdx) => (
                            <li key={sIdx} style={{ marginBottom: '0.5rem', color: '#333' }}>{sol}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RAW TEXT TAB */}
            {activeTab === 'raw' && (
              <div>
                <h3 style={{ marginTop: 0 }}>Extracted Text</h3>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>This is what the ATS sees. If text is missing here, the ATS won't see it either.</p>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.85rem', 
                  color: '#333', 
                  background: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {result.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
