import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// SPA routing fix for static hosts (Vercel):
// If the page was loaded via the 404.html redirect, restore the original path.
(function () {
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get('p');
  if (redirectPath) {
    // Replace the current history entry with the real path, removing the ?p= param
    window.history.replaceState(null, '', decodeURIComponent(redirectPath));
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
