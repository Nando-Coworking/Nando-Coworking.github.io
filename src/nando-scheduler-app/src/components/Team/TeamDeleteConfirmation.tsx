// src/components/TeamDeleteConfirmation.tsx
import React from 'react';
import { Offcanvas, ListGroup, Badge, Alert, Button } from 'react-bootstrap';
import { TeamUser } from '../../types/team';

interface Props {
    show: boolean;
    onHide: () => void;
    teamName: string;
    teamDescription: string;
    teamUsers: TeamUser[];
    isDeleting: boolean;
    onConfirmDelete: () => void;
}

export const TeamDeleteConfirmation: React.FC<Props> = ({
    show,
    onHide,
    teamName,
    teamDescription,
    teamUsers,
    isDeleting,
    onConfirmDelete
}) => (
    <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Delete Team?
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <div className="mb-4">
                <h5>{teamName}</h5>
                <p className="text-muted">{teamDescription}</p>
            </div>

            <div className="mb-4">
                <h6>Current Members:</h6>
                <ListGroup variant="flush" className="mb-3">
                    {teamUsers.map(teamUser => (
                        <ListGroup.Item
                            key={teamUser.id}
                            className="px-0 d-flex justify-content-between align-items-center"
                        >
                            <div>
                                <div>{teamUser.email}</div>
                                <Badge
                                    bg={teamUser.role === 'owner' ? 'primary' :
                                        teamUser.role === 'admin' ? 'warning' :
                                            'info'}
                                    text={teamUser.role === 'owner' ? undefined : 'dark'}
                                >
                                    <i className={`fas fa-${teamUser.role === 'owner' ? 'power-off' :
                                            teamUser.role === 'admin' ? 'lock' :
                                                'user'
                                        } me-1`}></i>
                                    {teamUser.role}
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
                    <li>All {teamUsers.length} members and their roles</li>
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
                    <i className="fas fa-chevron-left me-2"></i>Back
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
                            Yes, Delete Team
                        </>
                    )}
                </Button>
            </div>
        </Offcanvas.Body>
    </Offcanvas>
);