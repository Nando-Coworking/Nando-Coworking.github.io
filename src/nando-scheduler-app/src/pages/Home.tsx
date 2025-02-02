import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Container className="py-4">
      <section className="text-center mb-5">
        <h1>Welcome to Nando Coworking</h1>
        <p className="lead">
          Discover flexible workspace solutions. Book a reservation in seconds and
          get started on your next big idea.
        </p>
        <img
          src="https://picsum.photos/800/400.jpg?random=1"
          alt="Coworking space"
          className="img-fluid rounded shadow"
        />
      </section>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-users me-2"></i>
                Collaborative Spaces
              </Card.Title>
              <Card.Text>Team rooms for team projects and networking opportunities.</Card.Text>
              <img
                src="https://picsum.photos/400/100.jpg?random=2"
                alt="Coworking space"
                className="img-fluid rounded"
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-shield me-2"></i>
                Private Offices
              </Card.Title>
              <Card.Text>Quiet, dedicated offices with secure access for your team.</Card.Text>
              <img
                src="https://picsum.photos/400/100.jpg?random=3"
                alt="Coworking space"
                className="img-fluid rounded"
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow">
            <Card.Body>
              <Card.Title>
                <i className="fa-solid fa-person-running me-2"></i>
                Flexible Desks
              </Card.Title>
              <Card.Text>Pay-as-you-go desk space for quick tasks or mobile work setups.</Card.Text>
              <img
                src="https://picsum.photos/400/100.jpg?random=4"
                alt="Coworking space"
                className="img-fluid rounded"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <section className="text-center mt-5">
        <h3>Ready to schedule?</h3>
        <p>Check availability in our Scheduler to quickly reserve your ideal space.</p>
        <Button variant="primary" onClick={() => navigate('/scheduler')}>
          Go to Scheduler <i className="fas fa-chevron-right ms-2"></i>
        </Button>
      </section>
    </Container>
  );
}