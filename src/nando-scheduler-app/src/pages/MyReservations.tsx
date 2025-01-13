import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';

interface Reservation {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchReservations = async () => {
      try {
        if (!user) {
          if (mounted) {
            addToast('Please log in to view your reservations', 'warning');
            navigate('/scheduler');
          }
          return;
        }

        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (error) throw error;
        if (mounted) setReservations(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReservations();
    return () => { mounted = false; };
  }, [user]);

  const now = moment();

  const pastReservations = reservations.filter(reservation =>
    moment(reservation.end_time).isBefore(now)
  );

  const currentReservations = reservations.filter(reservation =>
    moment(reservation.start_time).isSameOrBefore(now) &&
    moment(reservation.end_time).isSameOrAfter(now)
  );

  const futureReservations = reservations.filter(reservation =>
    moment(reservation.start_time).isAfter(now)
  );

  return (
    <>
      <h3 className="mb-4"><i className="fa-solid fa-calendar-check me-2"></i>My Reservations</h3>
      
      {loading && (
        <div className="d-flex justify-content-center align-items-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <Card className="mb-4">
            <Card.Header>Current Reservations</Card.Header>
            <ListGroup variant="flush">
              {currentReservations.length > 0 ? (
                currentReservations.map(reservation => (
                  <ListGroup.Item key={reservation.id}>
                    <strong>{reservation.title}</strong>
                    <p>{reservation.description}</p>
                    <p>
                      {moment(reservation.start_time).format('LLL')} - {moment(reservation.end_time).format('LLL')}
                    </p>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>No current reservations</ListGroup.Item>
              )}
            </ListGroup>
          </Card>

          <Card className="mb-4">
            <Card.Header>Scheduled Reservations</Card.Header>
            <ListGroup variant="flush">
              {futureReservations.length > 0 ? (
                futureReservations.map(reservation => (
                  <ListGroup.Item key={reservation.id}>
                    <strong>{reservation.title}</strong>
                    <p>{reservation.description}</p>
                    <p>
                      {moment(reservation.start_time).format('LLL')} - {moment(reservation.end_time).format('LLL')}
                    </p>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>No scheduled reservations</ListGroup.Item>
              )}
            </ListGroup>
          </Card>

          <Card className="mb-4">
            <Card.Header>Past Reservations</Card.Header>
            <ListGroup variant="flush">
              {pastReservations.length > 0 ? (
                pastReservations.map(reservation => (
                  <ListGroup.Item key={reservation.id}>
                    <strong>{reservation.title}</strong>
                    <p>{reservation.description}</p>
                    <p>
                      {moment(reservation.start_time).format('LLL')} - {moment(reservation.end_time).format('LLL')}
                    </p>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>No past reservations</ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </>
      )}
    </>
  );
};

export default MyReservations;