import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import LogoForLight from '../assets/LogoWide_ForLight.png';
import LogoForDark from '../assets/LogoWide_ForDark.png';
import { Dropdown } from 'react-bootstrap';
import Cookies from 'js-cookie';

// First add helper function for initials
const getInitials = (email: string) => {
  return email
    .split('@')[0] // Get username part
    .slice(0, 2) // Get first two chars
    .toUpperCase();
};

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = Cookies.get('theme') || 'auto';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark);
      setIsDarkMode(shouldUseDark);

      if (navbarRef.current) {
        navbarRef.current.className = `navbar navbar-expand-lg border-bottom ${shouldUseDark ? 'navbar-dark bg-dark navbar-dark-custom' : 'navbar-light bg-light navbar-light-custom'
          }`;
        navbarRef.current.setAttribute('data-bs-theme', shouldUseDark ? 'dark' : 'light');
      }
    };

    // Watch for cookie changes
    const cookieInterval = setInterval(updateTheme, .100);

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    // Initial update
    updateTheme();

    // Cleanup
    return () => {
      clearInterval(cookieInterval);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      addToast('Successfully logged out', 'success');
    } catch (error) {
      addToast('Error logging out', 'error');
    }
  };

  return (
    <nav
      className={`navbar navbar-expand-lg border-bottom ${isDarkMode ? 'navbar-dark bg-dark navbar-dark-custom' : 'navbar-light bg-light navbar-light-custom'
        }`}
      data-bs-theme={isDarkMode ? 'dark' : 'light'}
    >
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={isDarkMode ? LogoForDark : LogoForLight}
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
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="fa fa-home me-1"></i>&nbsp;Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/scheduler">
                <i className="fa-solid fa-calendar-days"></i>&nbsp;Scheduler
              </Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/myreservations">
                  <i className="fa-solid fa-calendar-check"></i>&nbsp;My Reservations
                </Link>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/groups">
                  <i className="fas fa-users me-2"></i>Groups
                </Link>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/sites">
                  <i className="fas fa-building me-2"></i>Sites
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                <i className="fa-solid fa-circle-question"></i>&nbsp;About Us
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center">
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="nav-link d-flex align-items-center p-0">
                  <div className="d-flex align-items-center">
                    {user?.email ? (
                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginRight: '4px'  // Add spacing between avatar and caret
                        }}
                        title={user.email}
                      >
                        {getInitials(user.email)}
                      </div>
                    ) : (
                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          marginRight: '4px'  // Add spacing between avatar and caret
                        }}
                      >
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="fas fa-user me-2"></i>Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/preferences">
                    <i className="fas fa-cog me-2"></i>Preferences
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="fas fa-right-from-bracket me-2"></i>Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="nav-item d-flex">
                <Link className="nav-link" to="/signup">
                  <i className="fas fa-user-plus me-2"></i>Sign Up
                </Link>
                <span className="nav-link text-muted">&nbsp;|&nbsp;</span>
                <Link className="nav-link" to="/login">
                  <i className="fas fa-right-to-bracket me-2"></i>Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;