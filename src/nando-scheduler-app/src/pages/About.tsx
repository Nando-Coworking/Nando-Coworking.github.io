import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const About: React.FC = () => {
  return (
    <main>
      <h3><i className="fas fa-circle-question me-2"></i>About Us</h3>


      {/* How It Works Section */}
      <div className="container mb-5">
        <h3 className="text-center mb-4">
          <i className="fas fa-map me-2"></i>How It Works
        </h3>
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="fas fa-users-gear me-2"></i>Groups & Members
                </h4>
                <div className="card-text">
                  Every user starts with their own group. As a group owner, you can:
                </div>
                <ul>
                  <li>Invite others as admins or members</li>
                  <li>Manage group settings and permissions</li>
                  <li>Control access to resources</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="fas fa-building me-2"></i>Create Sites
                </h4>
                <div className="card-text">
                  Sites are physical locations where coworking happens. Owners and Admins can:
                </div>
                <ul>
                  <li>Set up new coworking locations</li>
                  <li>Define site details and policies</li>
                  <li>Manage site availability</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="fas fa-box me-2"></i>Add Resources
                </h4>
                <div className="card-text">
                  Resources are bookable spaces within sites, such as:
                </div>
                <ul>
                  <li>Offices and conference rooms</li>
                  <li>Recreational areas (courts, patios)</li>
                  <li>Specialized spaces</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="fas fa-list-check me-2"></i>Resource Amenities
                </h4>
                <div className="card-text">
                  Each resource can have various amenities:
                </div>
                <ul>
                  <li>Technology (WiFi, TV, projector)</li>
                  <li>Climate control (AC, heating)</li>
                  <li>Furniture and equipment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="container mb-5">
        <h3 className="text-center mb-4">
          <i className="fas fa-info-circle me-2"></i>About Us
        </h3>
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