import React, { useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    if (params.get('passwordChanged') === 'true') {
        // Add hidden form for password manager context
        const form = document.createElement('form');
        form.style.display = 'none';
        form.innerHTML = `
            <input type="text" name="username" autocomplete="username" value="${params.get('email') || ''}" />
            <input type="password" name="password" autocomplete="current-password" />
        `;
        document.body.appendChild(form);
        
        // Clean up after password manager has a chance to detect it
        setTimeout(() => {
            document.body.removeChild(form);
            // Clean up URL
            window.history.replaceState({}, '', '/profile');
        }, 3000);
    }
  }, []);

  return (
    <>
      <h3 className="mb-0"><i className="fas fa-user me-2"></i>My Profile</h3>
      <p className="mb-4 text-muted" style={{ borderBottom: '#dddddd solid 1px' }}>
        Use this form to view and update your profile information.
      </p>
      <Container className="mt-5 d-flex justify-content-center">
        <div style={{ width: '100%', maxWidth: '500px' }}>

          <Card>
            <Card.Body>
              <dl className="row">
                <dt className="col-sm-3">Email</dt>
                <dd className="col-sm-9">{user?.email}</dd>

                <dt className="col-sm-3">Password</dt>
                <dd className="col-sm-9">
                  <Button
                    className="btn btn-primary"
                    onClick={() => navigate('/change-password')}
                  >
                    Change Password<i className="fas fa-arrow-right ms-2"></i>
                  </Button>
                </dd>
              </dl>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </>
  );
};

export default Profile;