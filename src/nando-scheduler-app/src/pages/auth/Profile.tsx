import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
                    Change Password &gt;
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