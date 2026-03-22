import { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'pdfjs-dist';
import html2pdf from 'html2pdf.js';

// Set worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // analysis, editor
  
  // Editor State
  const [textBlocks, setTextBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const containerRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError('');
    setTextBlocks([]);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      setPdfFile(pdf);
      
      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }
      const loadedPages = await Promise.all(pagePromises);
      setPages(loadedPages);
      
      // Auto-switch to editor if file loaded
      if (loadedPages.length > 0) {
        setActiveTab('editor');
      }
    } catch (err) {
      setError('Failed to load PDF. Ensure it is a valid file.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageRender = async (page, index) => {
    const canvas = document.getElementById(`page-canvas-${index}`);
    if (!canvas) return;

    const viewport = page.getViewport({ scale: 1.5 }); // High res for editing
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return viewport;
  };

  const addTextBlock = (e, pageIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newBlock = {
      id: Date.now(),
      page: pageIndex,
      x,
      y,
      text: 'New Text',
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal'
    };
    setTextBlocks([...textBlocks, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const updateBlock = (id, field, value) => {
    setTextBlocks(blocks => blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const downloadPDF = () => {
    const element = containerRef.current;
    const opt = {
      margin: 0,
      filename: 'edited-cv.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Temporarily hide controls for clean print
    const controls = document.querySelectorAll('.editor-controls');
    controls.forEach(el => el.style.display = 'none');
    
    html2pdf().set(opt).from(element).save().then(() => {
      controls.forEach(el => el.style.display = 'flex');
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>CV Visual Editor</h1>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
      </header>

      {error && <div style={{ color: 'red', padding: '10px', background: '#ffe6e6' }}>{error}</div>}

      {loading && <div>Loading PDF Engine...</div>}

      {pages.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          
          {/* Toolbar */}
          <div className="editor-controls" style={{ width: '300px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', height: 'fit-content' }}>
            <h3>Tools</h3>
            <p style={{fontSize: '0.9rem', color: '#666'}}>Click anywhere on the CV to add/edit text.</p>
            
            {selectedBlock ? (
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                <h4>Edit Selected Text</h4>
                {textBlocks.filter(b => b.id === selectedBlock).map(block => (
                  <div key={block.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea 
                      value={block.text} 
                      onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                      rows={3}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <label>Font Size: {block.fontSize}px</label>
                    <input 
                      type="range" min="8" max="72" 
                      value={block.fontSize} 
                      onChange={(e) => updateBlock(block.id, 'fontSize', parseInt(e.target.value))} 
                    />
                    <label>Color</label>
                    <input 
                      type="color" 
                      value={block.color} 
                      onChange={(e) => updateBlock(block.id, 'color', e.target.value)} 
                    />
                    <label>Font Family</label>
                    <select 
                      value={block.fontFamily} 
                      onChange={(e) => updateBlock(block.id, 'fontFamily', e.target.value)}
                      style={{ padding: '5px' }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <button 
                      onClick={() => setTextBlocks(textBlocks.filter(b => b.id !== block.id))}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px', cursor: 'pointer', marginTop: '10px' }}
                    >
                      Delete Text
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{color: '#999', fontStyle: 'italic'}}>Select a text box to edit properties</p>
            )}

            <button 
              onClick={downloadPDF}
              style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Download Edited PDF
            </button>
          </div>

          {/* Canvas Area */}
          <div ref={containerRef} style={{ flex: 1, overflow: 'auto', background: '#555', padding: '20px', borderRadius: '8px' }}>
            {pages.map((page, index) => (
              <div key={index} style={{ position: 'relative', margin: '0 auto 20px auto', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                {/* Render PDF Page as Background Image */}
                <canvas 
                  id={`page-canvas-${index}`} 
                  onLoad={() => handlePageRender(page, index)}
                  style={{ display: 'block', maxWidth: '100%' }}
                />
                
                {/* Interactive Overlay Layer */}
                <div 
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    cursor: 'text' 
                  }}
                  onClick={(e) => addTextBlock(e, index)}
                >
                  {textBlocks.filter(b => b.page === index).map(block => (
                    <div
                      key={block.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id); }}
                      style={{
                        position: 'absolute',
                        left: block.x,
                        top: block.y,
                        fontSize: `${block.fontSize}px`,
                        fontFamily: block.fontFamily,
                        color: block.color,
                        fontWeight: block.fontWeight,
                        border: selectedBlock === block.id ? '2px dashed #007bff' : '1px solid transparent',
                        padding: '2px',
                        minWidth: '50px',
                        backgroundColor: selectedBlock === block.id ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                        cursor: 'move',
                        whiteSpace: 'pre-wrap',
                        zIndex: 10
                      }}
                    >
                      {block.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
