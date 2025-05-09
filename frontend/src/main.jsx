import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#282c34',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Cloud Secure Vault</h1>
        <p>Your secure cloud storage solution</p>
        <button 
          style={{
            backgroundColor: '#61dafb',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            color: 'black',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => alert('Button clicked!')}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
