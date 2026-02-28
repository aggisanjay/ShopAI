import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './store/index.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#12121f',
              color: '#fff',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '12px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#f59e0b', secondary: '#12121f' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#12121f' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
