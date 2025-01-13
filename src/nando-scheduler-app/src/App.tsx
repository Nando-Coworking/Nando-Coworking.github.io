import React from 'react';
import { Routes, Route, Link, redirect } from 'react-router-dom';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Scheduler from './pages/Scheduler';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js' 
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import LogoWide from './assets/LogoWide_ForLight.png';

export default function App() {
  return (

    <div className="container content-wrapper">
      {/* NavBar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-secondary">
        <div className="container">
          {/* <Link className="navbar-brand" to="/">
            <i className="fa fa-calendar" aria-hidden="true"></i> Nando Scheduler
          </Link> */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img 
              src={LogoWide} 
              alt="Nando Scheduler Logo" 
              height="30" 
              className="me-2"
            />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/"><i className="fa fa-home me-1"></i>&nbsp;Home</Link>
              </li>
              {/* <li className="nav-item">
                <Link className="nav-link" to="/services"><i className="fa-solid fa-bell-concierge"></i>&nbsp;Services</Link>
              </li> */}
              <li className="nav-item">
                <Link className="nav-link" to="/scheduler"><i className="fa-solid fa-calendar-days"></i>&nbsp;Scheduler</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about"><i className="fa-solid fa-circle-question"></i>&nbsp;About Us</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Route Definitions */}
      <div className="container mt-4 page-contents" id="pageContents">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/scheduler" element={<Scheduler />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer>
        <p>&copy; 2023 Nando Scheduler. All rights reserved. | Privacy Policy | Terms of Use</p>
      </footer>
    </div>
  );
}
