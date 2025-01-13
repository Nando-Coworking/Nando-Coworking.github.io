import React, { useState, FormEvent } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Link, useNavigate } from 'react-router-dom';

const ChangePassword: React.FC = () => {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean>(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const validatePassword = (pass: string, confirm: string): boolean => {
        if (pass.length < 8) return false;
        if (!/[A-Z]/.test(pass)) return false;
        if (!/[a-z]/.test(pass)) return false;
        if (!/[0-9]/.test(pass)) return false;
        if (!/[^A-Za-z0-9]/.test(pass)) return false;
        if (pass !== confirm) return false;
        return true;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setIsValid(validatePassword(newPassword, confirmPassword));
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);
        setIsValid(validatePassword(password, newConfirmPassword));
    };

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
            addToast(error.message, 'error');
        } else {
            addToast('Password updated successfully.', 'success');
            navigate('/profile');
        }
    };

    return (
        <>
            <h3 className="mb-0"><i className="fas fa-lock me-2"></i>Change Password</h3>
            <p className="mb-4 text-muted" style={{ borderBottom: '#dddddd solid 1px' }}>
                Use this form to change your password.
            </p>

            <Container className="mt-5 d-flex justify-content-center">
                <div style={{ width: '100%', maxWidth: '500px' }}>
                    <Form onSubmit={handleChangePassword}>

                        <Card>
                            <Card.Body>
                                <div className="row">
                                    {/* Left Column - Password Input */}
                                    <div className="col-md-6">
                                        <Form.Group className="mb-3" controlId="password">
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={password}
                                                onChange={handlePasswordChange}
                                                isValid={password.length > 0 && isValid}
                                                isInvalid={password.length > 0 && !isValid}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="confirmPassword">
                                            <Form.Label>Confirm Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={confirmPassword}
                                                onChange={handleConfirmPasswordChange}
                                                isValid={confirmPassword.length > 0 && isValid}
                                                isInvalid={confirmPassword.length > 0 && !isValid}
                                                required
                                            />
                                            {confirmPassword.length > 0 && !isValid && (
                                                <Form.Control.Feedback type="invalid">
                                                    Passwords must match and meet complexity requirements
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </div>

                                    {/* Vertical Divider */}
                                    <div className="col-md-1 d-none d-md-block">
                                        <div className="vr h-100"></div>
                                    </div>

                                    {/* Right Column - Helper Text */}
                                    <div className="col-md-5">
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

                            </Card.Body>
                        </Card>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <div className="d-flex justify-content-center">

                            <div className="mt-3">
                                <Link to="/profile" className="text-decoration-none btn btn-secondary me-2">
                                    <i className="fas fa-arrow-left me-2"></i>Back to Profile
                                </Link>
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={!isValid}
                                >
                                    Change Password<i className="fas fa-save ms-2"></i>
                                </Button>
                            </div>
                        </div>
                    </Form>

                </div>
            </Container>
        </>
    );
};

export default ChangePassword;