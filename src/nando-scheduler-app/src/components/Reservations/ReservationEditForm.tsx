import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Badge } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import moment from 'moment-timezone';
import { Reservation } from '../../types/reservation';

interface Props {
  show: boolean;
  onHide: () => void;
  reservation: Reservation | null;
  onReservationUpdated: () => void;
}

export const ReservationEditForm: React.FC<Props> = ({
  show,
  onHide,
  reservation,
  onReservationUpdated
}) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    participants: [] as string[]
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        title: reservation.title,
        description: reservation.description,
        start_time: moment.utc(reservation.start_time).local().format('YYYY-MM-DDTHH:mm'),
        end_time: moment.utc(reservation.end_time).local().format('YYYY-MM-DDTHH:mm'),
        participants: reservation.participants || []
      });
    }
  }, [reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    setIsSaving(true);
    try {
      const utcStart = moment(formData.start_time).utc().format();
      const utcEnd = moment(formData.end_time).utc().format();

      const { error } = await supabase
        .from('reservations')
        .update({
          title: formData.title,
          description: formData.description,
          start_time: utcStart,
          end_time: utcEnd,
          participants: formData.participants
        })
        .eq('id', reservation.id);

      if (error) throw error;
      onReservationUpdated();
      onHide();
      addToast('Reservation updated successfully', 'success');
    } catch (error) {
      console.error('Error updating reservation:', error);
      addToast('Error updating reservation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton className="border-bottom">
        <div>
          <Offcanvas.Title>
            <i className="fas fa-edit me-2"></i>Edit Reservation
          </Offcanvas.Title>
          <div className="text-muted" style={{ fontSize: '0.85em' }}>
            Update reservation details
          </div>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.end_time}
              onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Participants</Form.Label>
            <Form.Control
              type="email"
              placeholder="Add participant email"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const email = e.currentTarget.value.trim();
                  if (email && !formData.participants.includes(email)) {
                    setFormData({
                      ...formData,
                      participants: [...formData.participants, email]
                    });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <div className="mt-2">
              {formData.participants.map((email, index) => (
                <Badge 
                  key={index} 
                  bg="info" 
                  text="dark" 
                  className="me-2 mb-2 rounded-pill"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFormData({
                    ...formData,
                    participants: formData.participants.filter((_, i) => i !== index)
                  })}
                >
                  {email} ×
                </Badge>
              ))}
            </div>
          </Form.Group>
        </Form>
      </Offcanvas.Body>
      <div className="border-top mx-n3 px-3 py-3 mt-auto">
        <div className="d-flex justify-content-end">
          <Button variant="light" onClick={onHide} className="me-2">
            <i className="fas fa-chevron-left me-2"></i>Back
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Offcanvas>
  );
};