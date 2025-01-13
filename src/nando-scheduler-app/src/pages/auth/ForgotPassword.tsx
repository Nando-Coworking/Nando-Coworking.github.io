import React, { useState } from 'react';
import { Card, Container, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast(); // Extract addToast from the context object
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      });
      if (error) {
        setError(error.message);
        addToast(error.message, 'error');
      } else {
        addToast('Check your email for the password reset link.', 'success');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <h1 className="text-center mb-4">Forgot Password</h1>
          <p className="text-center mb-4">
            Enter your email address below and we'll send you a link to reset your password.
          </p>
          <Form onSubmit={handleForgotPassword}>
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
            {error && <Alert variant="danger">{error}</Alert>}
            <Button type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>Send Reset Link
                </>
              )}
            </Button>
          </Form>
          <div className="d-flex justify-content-center">
            <Link to="/login" className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>Back to Login
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ForgotPassword;