import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About: React.FC = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}><i className="fa-solid fa-circle-question me-2"></i>About Nando Coworking</h3>
      
      <div className="container">
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card" style={{ padding: '1rem' }}>
              <h4><i className="fa fa-bullseye" aria-hidden="true"></i> Our Mission</h4>
              <p>
                At Nando Coworking, we synergize cutting-edge solutions to empower
                dynamic professionals in a collaborative ecosystem. Our mission is to
                leverage innovative paradigms and deliver unparalleled value through
                holistic workspace solutions.
              </p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card" style={{ padding: '1rem' }}>
              <h4><i className="fa fa-cogs" aria-hidden="true"></i> Core Competencies</h4>
              <p>
                Our core competencies include fostering a culture of excellence,
                driving operational efficiencies, and maximizing stakeholder
                engagement. We are committed to a customer-centric approach that
                prioritizes seamless integration and scalable growth.
              </p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card" style={{ padding: '1rem' }}>
              <h4><i className="fa-solid fa-lightbulb" aria-hidden="true"></i> Innovative Approach</h4>
              <p>
                By harnessing the power of disruptive technologies and agile
                methodologies, we enable our clients to achieve sustainable
                competitive advantage. Our value proposition is underpinned by a
                relentless focus on quality, integrity, and continuous improvement.
              </p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card" style={{ padding: '1rem' }}>
              <h4><i className="fa-solid fa-handshake" aria-hidden="true"></i> Strategic Partnerships</h4>
              <p>
                We believe in the transformative potential of strategic partnerships
                and collaborative innovation. Our team of dedicated professionals is
                passionate about delivering bespoke solutions that align with the
                evolving needs of the modern workforce.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <section style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h3><i className="fa fa-users" aria-hidden="true"></i> Join Us</h3>
        <p>
          Join us on our journey to redefine the future of work. Together, we
          can unlock new opportunities, drive meaningful impact, and create
          lasting value for all stakeholders.
        </p>
        <p>
          
          <button 
            className="btn btn-primary" disabled>
            Navigate to Careers &gt;
          </button>
           
        </p>
      </section>
    </main>
  );
};

export default About;