import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import { supabase } from '../../supabaseClient';

interface ProfileData {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setError('No user found');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, addToast]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h1 className="mb-4">My Profile</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {profile && (
        <Card>
          <Card.Header>
            <div className="d-flex align-items-center">
              <img
                src={profile.avatar_url || `https://www.gravatar.com/avatar/${user?.email}?d=mp&s=64`}
                alt="Profile"
                className="rounded-circle me-3"
                width="64"
                height="64"
              />
              <div>
                <h4 className="mb-0">{profile.full_name || 'Anonymous User'}</h4>
                <small className="text-muted">{profile.email}</small>
              </div>
            </div>
          </Card.Header>
          
          <Card.Body>
            <dl className="row">
              <dt className="col-sm-3">Member Since</dt>
              <dd className="col-sm-9">
                {new Date(profile.created_at).toLocaleDateString()}
              </dd>
              
              <dt className="col-sm-3">Last Updated</dt>
              <dd className="col-sm-9">
                {new Date(profile.updated_at).toLocaleDateString()}
              </dd>
              
              <dt className="col-sm-3">User ID</dt>
              <dd className="col-sm-9">
                <code>{profile.id}</code>
              </dd>
            </dl>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Profile;