import React, { useState, FormEvent } from 'react';
import { Card, Container, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const validateEmail = (email: string): boolean => {
    // Updated regex to support email aliases with + symbol
    const emailRegex = /^[a-zA-Z0-9._-]+\+?[a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address. Example domains like example.com are not allowed.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      console.log('Attempting signup with:', { email }); // Debug log

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email_confirmed: false
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log('Signup response:', { data, error: signUpError }); // Debug log

      if (signUpError) {
        // Log full error details
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name
        });
        throw signUpError;
      }

      if (data?.user) {
        addToast('Please check your email for the confirmation link.', 'success');
        navigate('/login');
      } else {
        throw new Error('Signup failed - no user data returned');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup';
      console.error('Caught error:', err); // Debug log
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: '100%', maxWidth: '800px' }}>
        <Card.Body>
          <h1 className="text-center mb-4">Sign Up</h1>
          <p className="text-center mb-4">
            Please enter your email and password to create an account. If you already have an account, you can log in.
          </p>
          <Form onSubmit={handleSignUp}>
            <div className="row">
              {/* Left Column - Form Fields */}
              <div className="col-md-6 ps-md-5 pe-md-4">
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}
            <Button type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing up...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>Sign Up
                </>
              )}
            </Button>
              </div>

              {/* Vertical Divider */}
              <div className="col-md-1 d-none d-md-block">
                <div className="vr h-100"></div>
              </div>

              {/* Right Column - Helper Text */}
              <div className="col-md-5 d-flex align-items-center">
                <Form.Text className="text-muted">
                  <i className="fas fa-shield-alt me-2"></i>
                  <strong>Strong Password Tips:</strong>
                  <ul className="mt-2 mb-0">
                    <li>Use at least 8 characters</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Add numbers and special characters</li>
                    <li>Avoid using personal information</li>
                  </ul>
                  <small className="d-block mt-2">
                    <i className="fas fa-info-circle me-1"></i>
                    A strong password helps protect your account from unauthorized access.
                  </small>
                </Form.Text>
              </div>
            </div>


          </Form>
          <hr className="my-3 w-100" />
          <div className="d-flex justify-content-center">
          
            <Link to="/login" className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>Back to Login
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Signup;