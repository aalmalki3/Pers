import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Use relative path for production
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || 'Failed to upload');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Step 1: PDF Reader Test</h1>
      <p>Upload a CV to see if we can extract the text.</p>

      <div style={{ border: '2px dashed #ccc', padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <br /><br />
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Reading PDF...' : 'Extract Text'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', background: '#ffe6e6', padding: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#f9f9f9', padding: '1rem', border: '1px solid #ddd' }}>
          <h3>Success!</h3>
          <p><strong>File:</strong> {result.fileName}</p>
          <p><strong>Pages:</strong> {result.pageCount}</p>
          <hr />
          <h4>Extracted Text:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {result.extractedText}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
