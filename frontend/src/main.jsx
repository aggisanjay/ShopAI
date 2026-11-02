import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@fontsource-variable/inter';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import App from './App.jsx';
import { store } from './store/index.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          gutter={10}
          containerStyle={{ top: 84 }}
          toastOptions={{
            duration: 3200,
            style: {
              background: 'rgba(25,25,23,0.92)',
              backdropFilter: 'blur(16px)',
              color: '#f4f1ea',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '999px',
              padding: '10px 18px',
              fontFamily: '"Inter Variable", system-ui, sans-serif',
              fontSize: '13.5px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            },
            success: { iconTheme: { primary: '#ff6a3d', secondary: '#0b0b0a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0b0b0a' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
