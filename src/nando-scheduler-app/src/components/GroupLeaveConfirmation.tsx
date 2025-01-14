import React from 'react';
import { Offcanvas, Alert, Button } from 'react-bootstrap';

interface Props {
    show: boolean;
    onHide: () => void;
    groupName: string;
    groupDescription: string;
    isLeaving: boolean;
    onConfirmLeave: () => void;
}

export const GroupLeaveConfirmation: React.FC<Props> = ({
    show,
    onHide,
    groupName,
    groupDescription,
    isLeaving,
    onConfirmLeave
}) => (
    <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="text-warning">
                <i className="fas fa-sign-out-alt me-2"></i>
                Leave Group?
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <div className="mb-4">
                <h5>{groupName}</h5>
                <p className="text-muted">{groupDescription}</p>
            </div>

            <Alert variant="warning">
                <i className="fas fa-exclamation-circle me-2"></i>
                By leaving this group, you will lose access to:
                <ul className="mb-0 mt-2">
                    <li>All sites in this group</li>
                    <li>All resources in this group</li>
                    <li>Your existing reservations</li>
                    <li>Future scheduling capabilities</li>
                </ul>
            </Alert>
            
            <p className="text-muted small mt-3">
                This action cannot be undone. If you need access again in the future, 
                a group admin or owner will need to add you back to the group.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" onClick={onHide}>
                    <i className="fas fa-chevron-left me-2"></i>Back
                </Button>
                <Button
                    variant="warning"
                    onClick={onConfirmLeave}
                    disabled={isLeaving}
                >
                    {isLeaving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Leaving...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-sign-out-alt me-2"></i>
                            Yes, Leave Group
                        </>
                    )}
                </Button>
            </div>
        </Offcanvas.Body>
    </Offcanvas>
);