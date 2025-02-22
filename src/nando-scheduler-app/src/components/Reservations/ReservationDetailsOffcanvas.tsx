import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { useAuth } from '../../AuthContext';
// Import timezone support
import moment from 'moment-timezone';
import { ReservationEditForm } from './ReservationEditForm';
import { ReservationDeleteConfirmation } from './ReservationDeleteConfirmation';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Add state to track the local reservation data
  const [localReservation, setLocalReservation] = useState<Reservation | null>(null);

  // Update useEffect to set initial reservation
  useEffect(() => {
    setLocalReservation(reservation);
  }, [reservation]);

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    const localTime = moment.utc(dateTime).local();
    const zoneName = moment.tz(moment.tz.guess()).zoneAbbr();
    return `${localTime.format('MMMM D, YYYY h:mm A')} (${zoneName})`;
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
      setShowDeleteConfirm(false);
    }
  };

  const renderParticipants = () => {
    // Solo reservation
    if (!localReservation?.participants || localReservation.participants.length === 0) {
      return (
        <div className="d-flex gap-2 align-items-center">
          <Badge bg="success" className="rounded-pill">
            <i className="fas fa-user me-1"></i>Solo
          </Badge>
        </div>
      );
    }

    // Group reservation
    return (
      <div className="d-flex gap-2 align-items-center">
        <Badge
          bg={localReservation.user_id === user?.id ? "primary" : "secondary"}
          className="rounded-pill"
          style={{ fontSize: '0.75em' }}
        >
          <i className="fas fa-users me-1"></i>
          {localReservation.user_id === user?.id ? 'Owner' : 'Guest'}
        </Badge>
        <div className="d-flex gap-2 flex-wrap">
          {localReservation.participants.map((email, index) => (
            <Badge
              key={index}
              bg="info"
              text="dark"
              className="rounded-pill"
              style={{ fontSize: '0.75em', fontWeight: 'normal' }}
              title={email}
            >
              {email.split('@')[0]}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  // Add a handler for successful edits
  const handleReservationEdited = () => {
    // First notify the parent component
    onReservationUpdated();

    // Then fetch the updated reservation details
    if (reservation?.id) {
      fetchUpdatedReservation(reservation.id);
    }

    setShowEditForm(false);
  };

  // Add function to fetch updated reservation
  const fetchUpdatedReservation = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          resources:resource_id (
            *,
            sites:site_id (
              *,
              teams:team_id (*)
            )
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      // Update local state with fresh data
      setLocalReservation(data);
      // Notify parent
      onReservationUpdated();
    } catch (error) {
      console.error('Error fetching updated reservation:', error);
      addToast('Error refreshing reservation details', 'error');
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
            <h5>{localReservation?.title}</h5>
            <p className="text-muted">{localReservation?.description}</p>

            {/* Info sections container */}
            <div className="border rounded overflow-hidden">
              {/* Who section */}
              <div className="d-flex flex-column flex-md-row p-3 border-bottom">
                <div className="mb-2 mb-md-0 text-muted" style={{ minWidth: '80px' }}>
                  <i className="fas fa-users me-1"></i>Who:
                </div>
                <div className="flex-grow-1">
                  {renderParticipants()}
                </div>
              </div>

              {/* Where section */}
              <div className="d-flex flex-column flex-md-row p-3 border-bottom">
                <div className="mb-2 mb-md-0 text-muted" style={{ minWidth: '80px' }}>
                  <i className="fas fa-location-dot me-1"></i>Where:
                </div>
                <div className="flex-grow-1">
                  {localReservation?.resources?.name && (
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => onResourceClick?.(localReservation.resources)}
                    >
                      <i className="fas fa-box me-1"></i>{localReservation.resources.name}
                    </Button>
                  )}
                  {localReservation?.resources?.sites && (
                    <>
                      {" at "}
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => onSiteClick?.(localReservation.resources.sites)}
                      >
                        <i className="fas fa-building me-1"></i>{localReservation.resources.sites.name}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* When section */}
              <div className="d-flex flex-column flex-md-row p-3">
                <div className="mb-2 mb-md-0 text-muted" style={{ minWidth: '80px' }}>
                  <i className="fas fa-clock me-1"></i>When:
                </div>
                <div className="flex-grow-1">
                  <div>{formatDateTime(localReservation?.start_time)}</div>
                  <div>{formatDateTime(localReservation?.end_time)}</div>
                </div>
              </div>
            </div>

          </div>
        </Offcanvas.Body>
        <div className="border-top mx-n3 px-3 py-3 mt-auto">
          <div className="d-flex justify-content-between">
            {canDelete && (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
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
        reservation={localReservation}
        onReservationUpdated={handleReservationEdited}
      />

      <ReservationDeleteConfirmation
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        reservation={localReservation}
        isDeleting={isDeleting}
        onConfirmDelete={handleDelete}
      />
    </>
  );
};