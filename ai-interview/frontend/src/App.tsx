import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/clean-design.css';
import './styles/warm-theme.css';

// Candidate flow pages
import InviteLanding from './pages/InviteLanding';
import Consent from './pages/Consent';
import EnvCheck from './pages/EnvCheck';
import OTP from './pages/OTP';
import Identity from './pages/Identity';
import Interview from './pages/Interview';

// Admin pages
import AdminApp from './admin/AdminApp';

// Title management component
function TitleManager() {
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.title = 'Exatech Admin Panel';
    } else {
      document.title = 'Exatech Round 1 Interview';
    }
  }, [location]);
  
  return null;
}

function App() {
  // Apply warm theme overrides for dynamic content
  useEffect(() => {
    const applyWarmThemeOverrides = () => {
      // Override any dark inline styles
      const darkElements = document.querySelectorAll('[style*="rgb(30, 41, 59)"], [style*="rgb(15, 23, 42)"], [style*="rgb(51, 65, 85)"]');
      darkElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.backgroundColor = '#4A413C';
          if (el.tagName === 'INPUT') {
            el.style.color = '#EBEFFE';
            el.style.borderColor = '#BB6C43';
          }
        }
      });
      
      // Specifically target search inputs
      const searchInputs = document.querySelectorAll('input[placeholder*="search"], input[placeholder*="Search"]');
      searchInputs.forEach(input => {
        if (input instanceof HTMLElement) {
          input.style.backgroundColor = '#4A413C';
          input.style.color = '#EBEFFE';
          input.style.borderColor = '#BB6C43';
        }
      });
    };

    // Apply immediately
    applyWarmThemeOverrides();
    
    // Apply after short delays to catch dynamic content
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(applyWarmThemeOverrides, delay)
    );
    
    // Observe for changes
    const observer = new MutationObserver(applyWarmThemeOverrides);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    return () => {
      timeouts.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <Router>
      <TitleManager />
      <Routes>
        {/* Candidate Interview Flow */}
        <Route path="/i/:token" element={<InviteLanding />} />
        <Route path="/consent/:token" element={<Consent />} />
        <Route path="/env/:token" element={<EnvCheck />} />
        <Route path="/otp/:token" element={<OTP />} />
        <Route path="/identity/:token" element={<Identity />} />
        <Route path="/interview/:token" element={<Interview />} />
        
        {/* Admin Interface */}
        <Route path="/admin/*" element={<AdminApp />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;