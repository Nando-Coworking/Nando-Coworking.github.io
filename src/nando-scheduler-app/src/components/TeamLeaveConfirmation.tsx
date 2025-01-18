import React from 'react';
import { Offcanvas, Alert, Button } from 'react-bootstrap';

interface Props {
    show: boolean;
    onHide: () => void;
    teamName: string;
    teamDescription: string;
    isLeaving: boolean;
    onConfirmLeave: () => void;
}

export const TeamLeaveConfirmation: React.FC<Props> = ({
    show,
    onHide,
    teamName,
    teamDescription,
    isLeaving,
    onConfirmLeave
}) => (
    <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="text-warning">
                <i className="fas fa-sign-out-alt me-2"></i>
                Leave Team?
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <div className="mb-4">
                <h5>{teamName}</h5>
                <p className="text-muted">{teamDescription}</p>
            </div>

            <Alert variant="warning">
                <i className="fas fa-exclamation-circle me-2"></i>
                By leaving this team, you will lose access to:
                <ul className="mb-0 mt-2">
                    <li>All sites in this team</li>
                    <li>All resources in this team</li>
                    <li>Your existing reservations</li>
                    <li>Future scheduling capabilities</li>
                </ul>
            </Alert>

            <p className="text-muted small mt-3">
                This action cannot be undone. If you need access again in the future,
                a team admin or owner will need to add you back to the team.
            </p>
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
                            Yes, Leave Team
                        </>
                    )}
                </Button>
            </div>
        </div>
    </Offcanvas>
);