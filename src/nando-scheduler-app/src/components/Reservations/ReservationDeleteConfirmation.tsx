// src/components/Reservations/ReservationDeleteConfirmation.tsx
import React from 'react';
import { Offcanvas, Alert, Button } from 'react-bootstrap';
import { Reservation } from '../../types/reservation';
import moment from 'moment';

interface Props {
  show: boolean;
  onHide: () => void;
  reservation: Reservation | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

export const ReservationDeleteConfirmation: React.FC<Props> = ({
  show,
  onHide,
  reservation,
  isDeleting,
  onConfirmDelete
}) => {
  if (!reservation) return null;

  const startTime = moment.utc(reservation.start_time).local();
  const endTime = moment.utc(reservation.end_time).local();
  const zoneName = moment.tz(moment.tz.guess()).zoneAbbr();

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="text-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Delete Reservation?
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div className="mb-4">
          <h5>{reservation.title}</h5>
          <p className="text-muted">{reservation.description}</p>
        </div>

        <Alert variant="danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          You are about to delete this reservation:
          <ul className="mb-0 mt-2">
            <li>
              <strong>When:</strong> {startTime.format('MMMM D, YYYY h:mm A')} - {endTime.format('h:mm A')} ({zoneName})
            </li>
            <li>
              <strong>Where:</strong> {reservation.resources?.name} at {reservation.resources?.sites?.name}
            </li>
            {reservation.participants && reservation.participants.length > 0 && (
              <li>
                <strong>Participants:</strong> {reservation.participants.length} invited
              </li>
            )}
          </ul>
        </Alert>

        <p className="text-muted small mt-3">
          This action cannot be undone. All participants will be notified of the cancellation.
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
                <i className="fas fa-trash-alt me-2"></i>Yes, Delete Reservation
              </>
            )}
          </Button>
        </div>
      </div>
    </Offcanvas>
  );
};