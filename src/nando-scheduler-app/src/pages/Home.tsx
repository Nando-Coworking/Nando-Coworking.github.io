import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <main style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <section style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Welcome to Nando Coworking</h1>
        <p>
          Discover flexible workspace solutions. Book a reservation in seconds and
          get started on your next big idea.
        </p>
        <img
          src="https://picsum.photos/800/400.jpg?random=1"
          alt="Coworking space"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
      </section>

      <section style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', background: '#f0f0f0', padding: '1rem' }}>
          <h3><i className="fa-solid fa-users"></i>&nbsp;Collaborative Spaces</h3>
          <p>Group rooms for team projects and networking opportunities.</p>
          <img
          src="https://picsum.photos/400/100.jpg?random=2"
          alt="Coworking space"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
        </div>
        <div style={{ flex: '1 1 300px', background: '#f9f9f9', padding: '1rem' }}>
          <h3><i className="fa-solid fa-shield"></i>&nbsp;Private Offices</h3>
          <p>Quiet, dedicated offices with secure access for your team.</p>
          <img
          src="https://picsum.photos/400/100.jpg?random=3"
          alt="Coworking space"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
        </div>
        <div style={{ flex: '1 1 300px', background: '#f0f0f0', padding: '1rem' }}>
          <h3><i className="fa-solid fa-person-running"></i>&nbsp;Flexible Desks</h3>
          <p>Pay-as-you-go desk space for quick tasks or mobile work setups.</p>
          <img
          src="https://picsum.photos/400/100.jpg?random=4"
          alt="Coworking space"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
        </div>
      </section>

      <section style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h3>Ready to schedule?</h3>
        <p>
          Check availability in our Scheduler to quickly reserve your ideal space.
        </p>
        <p>
          
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/scheduler')}
          >
            Go to Scheduler &gt;
          </button>
           
        </p>
      </section>
    </main>
  );
}