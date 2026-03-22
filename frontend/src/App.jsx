import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues', 'strengths', 'raw'

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
    if (severity === 'critical') return '#dc3545'; // Red
    if (severity === 'high') return '#fd7e14'; // Orange
    return '#ffc107'; // Yellow
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto', color: '#333' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#2c3e50' }}>CV ATS Analyzer</h1>
        <p style={{ color: '#666' }}>Detect gaps, weaknesses, and ATS compatibility issues instantly.</p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Analysis Results: {result.fileName}</h2>
            <span style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
              {result.issues.length} Issues Found
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('issues')}
              style={{ padding: '10px 20px', background: activeTab === 'issues' ? '#2563eb' : 'transparent', color: activeTab === 'issues' ? 'white' : '#333', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0' }}
            >
              Issues & Gaps ({result.issues.length})
            </button>
            <button 
              onClick={() => setActiveTab('strengths')}
              style={{ padding: '10px 20px', background: activeTab === 'strengths' ? '#2563eb' : 'transparent', color: activeTab === 'strengths' ? 'white' : '#333', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginLeft: '4px' }}
            >
              Strengths ({result.strengths.length})
            </button>
            <button 
              onClick={() => setActiveTab('raw')}
              style={{ padding: '10px 20px', background: activeTab === 'raw' ? '#2563eb' : 'transparent', color: activeTab === 'raw' ? 'white' : '#333', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0', marginLeft: '4px' }}
            >
              Raw Text
            </button>
          </div>

          {/* Content Area */}
          <div style={{ background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '300px' }}>
            
            {activeTab === 'issues' && (
              <div>
                {result.issues.length === 0 ? (
                  <p style={{ color: 'green', fontWeight: 'bold' }}>No critical issues found! Great job.</p>
                ) : (
                  result.issues.map((issue, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ 
                          width: '12px', height: '12px', borderRadius: '50%', 
                          background: getSeverityColor(issue.severity), 
                          marginRight: '10px', display: 'inline-block' 
                        }}></span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{issue.title}</h3>
                        <span style={{ marginLeft: '10px', fontSize: '0.8rem', background: '#eee', padding: '2px 8px', borderRadius: '4px' }}>{issue.category}</span>
                      </div>
                      <p style={{ color: '#555', margin: '0.5rem 0 1rem 22px' }}>{issue.description}</p>
                      
                      {/* Solutions Box */}
                      <div style={{ background: '#f0f7ff', padding: '1rem', borderRadius: '6px', marginLeft: '22px' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#2563eb' }}>💡 Recommended Fixes:</strong>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
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

            {activeTab === 'strengths' && (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {result.strengths.map((str, idx) => (
                  <li key={idx} style={{ padding: '1rem', background: '#ecfdf5', borderLeft: '4px solid #10b981', marginBottom: '1rem', color: '#065f46' }}>
                    <strong>✓ {str}</strong>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'raw' && (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#333', background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                {result.rawText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
