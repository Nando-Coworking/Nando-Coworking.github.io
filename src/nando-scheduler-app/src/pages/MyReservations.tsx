import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import moment from 'moment';

interface Reservation {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        if (!user) {
          setError('No user found');
          return;
        }

        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        setReservations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
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
    <Container className="mt-5">
      <h1 className="mb-4">My Reservations</h1>
      
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
    </Container>
  );
};

export default MyReservations;