import React, { useState } from 'react';
import './App.css';

function App() {
  const [personImage, setPersonImage] = useState(null);
  const [garmentImage, setGarmentImage] = useState(null);
  const [useAutoMask, setUseAutoMask] = useState(true);
  const [showError, setShowError] = useState(false);

  const handlePersonImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGarmentImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = () => {
    setShowError(true);
  };

  return (
    <div className="App">
      {/* Header Navigation */}
      <header className="header">
        <div className="logo">VTON</div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Top Section - 3 Boxes */}
        <div className="top-section">
          {/* Person Image Upload */}
          <div className="upload-box">
            <div className="upload-area">
              {personImage ? (
                <img src={personImage} alt="Person" className="preview-image" />
              ) : (
                <div className="upload-placeholder">
                  <p>Upload an image</p>
                  <p className="or-text">or</p>
                  <p>select the draw tool to start</p>
                </div>
              )}
            </div>
            <label className="upload-button">
              <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePersonImageUpload}
                className="file-input"
              />
            </label>
          </div>

          {/* Garment Upload */}
          <div className="upload-box">
            <div className="box-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
              </svg>
              <span>Garment</span>
            </div>
            <div className="upload-area garment-area">
              {garmentImage ? (
                <img src={garmentImage} alt="Garment" className="preview-image" />
              ) : (
                <div className="upload-placeholder">
                  <svg className="upload-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="drop-text">Drop Image Here</p>
                  <p className="or-text-small">- or -</p>
                  <p className="click-text">Click to Upload</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleGarmentImageUpload}
                className="file-input-overlay"
              />
            </div>
          </div>

          {/* Masked Image Output */}
          <div className="upload-box">
            <div className="box-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
              </svg>
              <span>Masked image output</span>
            </div>
            <div className="output-area">
              <svg className="output-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <polyline points="21 15 16 10 5 21" strokeWidth={2}/>
              </svg>
            </div>
          </div>
        </div>

        {/* Auto-generated Mask Option */}
        <div className="mask-option">
          <div className="mask-checkbox-container">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={useAutoMask}
                onChange={(e) => setUseAutoMask(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Yes</span>
            </label>
            <p className="mask-description">Use auto-generated mask (Takes 5 seconds)</p>
          </div>
        </div>

        {/* Output Section */}
        <div className="output-section">
          <div className="box-label output-label">
            <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
            </svg>
            <span>Output</span>
          </div>
          <div className="output-display">
            <svg className="output-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <polyline points="21 15 16 10 5 21" strokeWidth={2}/>
            </svg>
          </div>
        </div>

        {/* Try-on Button */}
        <button className="try-on-button" onClick={handleTryOn}>Try-on</button>
      </div>

      {/* Error Modal */}
      {showError && (
        <div className="error-overlay" onClick={() => setShowError(false)}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <button className="error-close" onClick={() => setShowError(false)}>×</button>
            <div className="error-content">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="error-text">
                <h3 className="error-title">Error</h3>
                <p className="error-message">
                  GPU Not Detected: This feature requires a GPU to function properly. Please switch to a device with GPU support to continue.
                </p>
              </div>
            </div>
            <div className="error-footer">
              <button className="error-button" onClick={() => setShowError(false)}>Error</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
