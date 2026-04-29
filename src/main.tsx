import React from 'react';
import { createRoot } from 'react-dom/client';
import "uno.css";
import App from '@src/App.js';
import "@src/store/i18n.js";


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);