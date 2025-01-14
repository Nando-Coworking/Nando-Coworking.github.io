import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Scheduler from './pages/Scheduler';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import Profile from './pages/auth/Profile';
import Preferences from './pages/auth/Preferences';
import MyReservations from './pages/MyReservations';
import NavBar from './components/NavBar';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';
import Cookies from 'js-cookie';
import Groups from './pages/Groups';
import Sites from './pages/Sites';

// Add this function before the App component
const applyTheme = (selectedTheme: 'auto' | 'light' | 'dark') => {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const shouldUseDark = selectedTheme === 'dark' || 
    (selectedTheme === 'auto' && prefersDark);

  // Remove existing theme classes
  document.body.classList.remove('bg-light', 'bg-dark');
  
  // Apply new theme immediately
  if (shouldUseDark) {
    document.body.classList.add('bg-dark');
    root.setAttribute('data-bs-theme', 'dark');
    updateImages(true);
  } else {
    document.body.classList.add('bg-light');
    root.setAttribute('data-bs-theme', 'light');
    updateImages(false);
  }
};

const updateImages = (isDark: boolean) => {
  // Update favicon
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = isDark ? '/LogoSquare_ForDark.png' : '/LogoSquare_ForLight.png';
  }

  // Update navbar logo
  const logo = document.querySelector<HTMLImageElement>('.navbar-brand img');
  if (logo) {
    logo.src = isDark ? '/LogoWide_ForDark.png' : '/LogoWide_ForLight.png';
  }
};

export default function App() {
  // Add theme initialization effect
  useEffect(() => {
    const savedTheme = Cookies.get('theme');
    
    // If no theme cookie exists, set it to 'auto'
    if (!savedTheme) {
      Cookies.set('theme', 'auto', { expires: 365 });
    }

    // Apply theme (will use 'auto' if no cookie exists)
    applyTheme((savedTheme as 'auto' | 'light' | 'dark') || 'auto');

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = Cookies.get('theme') || 'auto';
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="container content-wrapper">
          <NavBar />

          <div className="container mt-4 page-contents" id="pageContents">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/scheduler/:city" element={<Scheduler />} />
              <Route path="/scheduler/:city/:resource" element={<Scheduler />} />
              <Route path="/myreservations" element={<MyReservations />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </div>

          <footer>
            <p>&copy; 2025 Nando Scheduler. All rights reserved. | Privacy Policy | Terms of Use</p>
          </footer>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
