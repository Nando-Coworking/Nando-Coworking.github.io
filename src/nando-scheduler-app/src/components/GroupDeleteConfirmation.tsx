// src/components/GroupDeleteConfirmation.tsx
import React from 'react';
import { Offcanvas, ListGroup, Badge, Alert, Button } from 'react-bootstrap';
import { GroupUser } from '../types/group';

interface Props {
    show: boolean;
    onHide: () => void;
    groupName: string;
    groupDescription: string;
    groupUsers: GroupUser[];
    isDeleting: boolean;
    onConfirmDelete: () => void;
}

export const GroupDeleteConfirmation: React.FC<Props> = ({
    show,
    onHide,
    groupName,
    groupDescription,
    groupUsers,
    isDeleting,
    onConfirmDelete
}) => (
    <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Delete Group?
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <div className="mb-4">
                <h5>{groupName}</h5>
                <p className="text-muted">{groupDescription}</p>
            </div>

            <div className="mb-4">
                <h6>Current Members:</h6>
                <ListGroup variant="flush" className="mb-3">
                    {groupUsers.map(groupUser => (
                        <ListGroup.Item
                            key={groupUser.id}
                            className="px-0 d-flex justify-content-between align-items-center"
                        >
                            <div>
                                <div>{groupUser.email}</div>
                                <Badge
                                    bg={groupUser.role === 'owner' ? 'primary' :
                                        groupUser.role === 'admin' ? 'warning' :
                                            'info'}
                                    text={groupUser.role === 'owner' ? undefined : 'dark'}
                                >
                                    <i className={`fas fa-${groupUser.role === 'owner' ? 'power-off' :
                                            groupUser.role === 'admin' ? 'lock' :
                                                'user'
                                        } me-1`}></i>
                                    {groupUser.role}
                                </Badge>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>

            <Alert variant="danger">
                <i className="fas fa-exclamation-circle me-2"></i>
                This will permanently delete:
                <ul className="mb-0 mt-2">
                    <li>All {groupUsers.length} members and their roles</li>
                    <li>All associated sites</li>
                    <li>All associated resources</li>
                    <li>All reservations for those resources</li>
                </ul>
            </Alert>
            <p className="text-muted small mt-3">
                This action cannot be undone.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" onClick={onHide}>
                    <i className="fas fa-arrow-left me-2"></i>Back
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirmDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-trash-alt me-2"></i>
                            Yes, Delete Group
                        </>
                    )}
                </Button>
            </div>
        </Offcanvas.Body>
    </Offcanvas>
);