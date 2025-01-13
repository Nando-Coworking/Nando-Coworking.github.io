import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import LogoWide from '../assets/LogoWide_ForLight.png';
import { Dropdown } from 'react-bootstrap';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Successfully logged out', 'success');
    } catch (error) {
      addToast('Error logging out', 'error');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-secondary">
      <div className="container">
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
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                <i className="fa-solid fa-circle-question"></i>&nbsp;About Us
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center">
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="nav-link text-light p-0">
                  <img
                    src={`https://www.gravatar.com/avatar/${user.email ? user.email.toLowerCase().trim() : ''}?d=mp&s=32`}
                    alt="Profile"
                    className="rounded-circle"
                    width="32"
                    height="32"
                  />
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
                <Link className="nav-link text-light" to="/signup"><i className="fas fa-user-plus me-2"></i>Sign Up</Link>
                <span className="nav-link text-dark">&nbsp;|&nbsp;</span>
                <Link className="nav-link text-light" to="/login"><i className="fas fa-right-to-bracket me-2"></i>Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;