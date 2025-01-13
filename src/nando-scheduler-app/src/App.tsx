import React from 'react';
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

export default function App() {
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
              <Route path="/myreservations" element={<MyReservations />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </div>

          <footer>
            <p>&copy; 2023 Nando Scheduler. All rights reserved. | Privacy Policy | Terms of Use</p>
          </footer>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
