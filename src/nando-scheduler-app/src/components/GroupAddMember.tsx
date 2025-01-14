import React, { useState } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Group } from '../types/group';

interface Props {
    show: boolean;
    onHide: () => void;
    selectedGroup: Group | null;
    onMemberAdded: () => void;
}

export const GroupAddMember: React.FC<Props> = ({
    show,
    onHide,
    selectedGroup,
    onMemberAdded
}) => {
    const { addToast } = useToast();
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('member');
    const [isAddingMember, setIsAddingMember] = useState(false);

    const handleAddUser = async () => {
        if (!selectedGroup) return;
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
                .from('group_users')
                .insert([{
                    group_id: selectedGroup.id,
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
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title><i className="fas fa-user-plus me-2"></i>Add Member</Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Use the area below to add a member to the current group: "{selectedGroup?.name}"
                    </div>
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
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button
                            variant="light"
                            onClick={onHide}
                        >
                            <i className="fas fa-arrow-left me-2"></i>Back
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
                </Form>
            </Offcanvas.Body>
        </Offcanvas>
    );
};