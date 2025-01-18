import React, { useState } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Team } from '../types/team';

interface Props {
    show: boolean;
    onHide: () => void;
    selectedTeam: Team | null;
    onMemberAdded: () => void;
}

export const TeamAddMember: React.FC<Props> = ({
    show,
    onHide,
    selectedTeam,
    onMemberAdded
}) => {
    const { addToast } = useToast();
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('member');
    const [isAddingMember, setIsAddingMember] = useState(false);

    const handleAddUser = async () => {
        if (!selectedTeam) return;
        setIsAddingMember(true);
        try {
            const { data: userId, error: userError } = await supabase
                .rpc('get_user_id_by_email', {
                    _email: newEmail
                });

            if (userError) throw userError;

            if (!userId) {
                addToast('User not found with that email', 'error');
                return;
            }

            const { error } = await supabase
                .from('team_users')
                .insert([{
                    team_id: selectedTeam.id,
                    user_id: userId,
                    role: newRole
                }]);

            if (error) throw error;

            addToast('User added successfully', 'success');
            onMemberAdded();
            setNewEmail('');
            onHide();
        } catch (error) {
            console.error('Error adding user:', error);
            addToast('Error adding user', 'error');
        } finally {
            setIsAddingMember(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header className="border-bottom">
                <div>
                    <Offcanvas.Title><i className="fas fa-user-plus me-2"></i>Add Member</Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Use the area below to add a member to the current team: "{selectedTeam?.name}"
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={onHide}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '1.5rem',
                            zIndex: 2
                        }}
                    />
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Offcanvas.Body>
            <div className="border-top mx-n3 px-3 py-3 mt-auto">
                <div className="d-flex justify-content-end">
                    <Button
                        variant="light"
                        onClick={onHide}
                        className="me-2"
                    >
                        <i className="fas fa-chevron-left me-2"></i>Back
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        disabled={isAddingMember}
                    >
                        {isAddingMember ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-2"></i>
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};