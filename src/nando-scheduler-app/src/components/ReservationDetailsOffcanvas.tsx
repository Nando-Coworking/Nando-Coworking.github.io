import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';
// Import timezone support
import moment from 'moment-timezone';
import { ReservationEditForm } from './ReservationEditForm';

interface Props {
  show: boolean;
  onHide: () => void;
  reservation: Reservation | null;
  onReservationUpdated: () => void;
  onReservationDeleted: () => void;
  onResourceClick?: (resource: Resource) => void;
  onSiteClick?: (site: Site) => void;
}

export const ReservationDetailsOffcanvas: React.FC<Props> = ({
  show,
  onHide,
  reservation,
  onReservationUpdated,
  onReservationDeleted,
  onResourceClick,
  onSiteClick
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDateTime = (dateTime: string) => {
    const localTime = moment.utc(dateTime).local();
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${localTime.format('MMMM D, YYYY h:mm A')} (${timezoneName})`;
  };

  const canEdit = user?.id === reservation?.user_id && 
    moment(reservation?.end_time).isAfter(moment());

  const canDelete = user?.id === reservation?.user_id && 
    moment(reservation?.start_time).isAfter(moment());

  const handleDelete = async () => {
    if (!reservation) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservation.id);

      if (error) throw error;

      addToast('Reservation deleted successfully', 'success');
      onReservationDeleted();
      onHide();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      addToast('Error deleting reservation', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Offcanvas show={show} onHide={onHide} placement="end">
        <Offcanvas.Header closeButton className="border-bottom">
          <div>
            <Offcanvas.Title>
              <i className="fas fa-calendar me-2"></i>Reservation Details
            </Offcanvas.Title>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div>
            <h5>{reservation?.title}</h5>
            <p className="text-muted">{reservation?.description}</p>
            <p>
              <i className="fas fa-clock me-2"></i>
              {formatDateTime(reservation?.start_time)} - 
              {formatDateTime(reservation?.end_time)}
            </p>

            {/* Only show site if available */}
            {reservation?.resources?.sites && (
              <p>
                <i className="fas fa-map-marker-alt me-2"></i>
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => onSiteClick?.(reservation.resources.sites)}
                >
                  {reservation.resources.sites.name}
                </Button>
              </p>
            )}

            {/* Only show resource if available */}
            {reservation?.resources && (
              <p>
                <i className="fas fa-box me-2"></i>
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => onResourceClick?.(reservation.resources)}
                >
                  {reservation.resources.name}
                </Button>
              </p>
            )}

            {/* Always show participants since they're on the reservation itself */}
            <p>
              <i className="fas fa-users me-2"></i>Participants:
              {reservation?.participants?.map((email, index) => (
                <Badge 
                  key={index} 
                  bg="info" 
                  text="dark" 
                  className="ms-2 rounded-pill"
                >
                  {email}
                </Badge>
              ))}
            </p>
          </div>
        </Offcanvas.Body>
        <div className="border-top mx-n3 px-3 py-3 mt-auto">
          <div className="d-flex justify-content-between">
            {canDelete && (
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                <i className="fas fa-trash-alt me-2"></i>Delete
              </Button>
            )}
            <div className="ms-auto">
              <Button variant="light" onClick={onHide} className="me-2">
                <i className="fas fa-chevron-left me-2"></i>Back
              </Button>
              {canEdit && (
                <Button variant="primary" onClick={() => setShowEditForm(true)}>
                  <i className="fas fa-edit me-2"></i>Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </Offcanvas>

      <ReservationEditForm
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        reservation={reservation}
        onReservationUpdated={() => {
          onReservationUpdated();
          setShowEditForm(false);
        }}
      />
    </>
  );
};