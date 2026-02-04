import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Force Render rebuild - 2026-02-04
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
