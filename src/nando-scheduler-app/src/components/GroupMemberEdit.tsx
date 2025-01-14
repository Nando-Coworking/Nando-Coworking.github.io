import React, { useState } from 'react';
import { Offcanvas, Form, Button, Alert, Badge } from 'react-bootstrap';
import { GroupUser } from '../types/group';

interface Props {
    show: boolean;
    onHide: () => void;
    groupName: string;
    member: GroupUser;
    onRoleChange: (userId: string, newRole: string) => Promise<void>;
    onRemoveUser: (userId: string) => Promise<void>;
    currentUserRole?: string;
}

export const GroupMemberEdit: React.FC<Props> = ({
    show,
    onHide,
    groupName,
    member,
    onRoleChange,
    onRemoveUser,
    currentUserRole
}) => {
    const [currentRole, setCurrentRole] = useState(member.role);
    const [isChangingRole, setIsChangingRole] = useState(false);
    
    const canManageMembers = (role?: string) => ['owner', 'admin'].includes(role || '');
    const canModifyRole = canManageMembers(currentUserRole) && member.role !== 'owner';
    const canPromoteToAdmin = currentUserRole === 'owner';
    const isAdmin = currentUserRole === 'admin';

    const handleRoleChange = async (newRole: string) => {
        if (!canModifyRole) return;
        setIsChangingRole(true);
        try {
            await onRoleChange(member.user_id, newRole);
            setCurrentRole(newRole);
        } finally {
            setIsChangingRole(false);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="border-bottom">
                <div>
                    <Offcanvas.Title>
                        <i className="fas fa-user-edit me-2"></i>Edit Member
                    </Offcanvas.Title>
                    <div className="text-muted" style={{ fontSize: '0.85em' }}>
                        Use the area below to manage the member of the group: "{groupName}"
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mb-4">
                    <h6>Member Details</h6>
                    <div>{member.email}</div>
                    <Badge
                        bg={currentRole === 'owner' ? 'primary' :
                            currentRole === 'admin' ? 'warning' :
                                'info'}
                        text={currentRole === 'owner' ? undefined : 'dark'}
                    >
                        <i className={`fas fa-${currentRole === 'owner' ? 'power-off' :
                            currentRole === 'admin' ? 'lock' :
                                'user'
                            } me-1`}></i>
                        {currentRole}
                    </Badge>
                </div>

                <Form.Group className="mb-4">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                        value={currentRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={!canModifyRole || currentRole === 'owner' || isChangingRole}
                    >
                        <option value="member">Member</option>
                        {(canPromoteToAdmin || isAdmin) && <option value="admin">Admin</option>}
                    </Form.Select>
                    {isChangingRole && (
                        <div className="text-muted mt-2">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating role...
                        </div>
                    )}
                    <Form.Text className="text-muted">
                        {!canModifyRole && "You don't have permission to modify this user's role"}
                        {canModifyRole && canPromoteToAdmin && "Admins can manage members and group settings"}
                        {canModifyRole && !canPromoteToAdmin && "You can only modify member roles"}
                    </Form.Text>
                </Form.Group>

                <hr className="my-4 border-danger" />

                <div className="mt-4">
                    <h6 className="text-danger">Danger Zone</h6>
                    <p className="text-muted small">
                        Removing a member will revoke their access to all group resources immediately.
                    </p>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                            onRemoveUser(member.user_id);
                            onHide();
                        }}
                        disabled={member.role === 'owner'}
                    >
                        <i className="fas fa-user-minus me-2"></i>
                        Immediately Remove from Group
                    </Button>
                </div>
            </Offcanvas.Body>

            <div className="border-top mx-n3 px-3 py-3 mt-auto">
                <div className="d-flex justify-content-end">
                    <Button
                        variant="light"
                        onClick={onHide}
                    >
                        <i className="fas fa-chevron-left me-2"></i>Back
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};