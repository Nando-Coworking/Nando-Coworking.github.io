import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Tabs, Tab, Spinner, Badge } from 'react-bootstrap';
//import moment from 'moment';
import moment from 'moment-timezone';
import { supabase } from '../supabaseClient';
import { Site } from '../types/site';
import { Resource } from '../types/resource';
import { Team } from '../types/team';
import { SiteDetailsOffcanvas } from '../components/SiteDetailsOffcanvas';
import { ResourceDetailsOffcanvas } from '../components/ResourceDetailsOffcanvas';
import { TeamDetailsOffcanvas } from '../components/TeamDetailsOffcanvas';
import { useParams, useNavigate } from 'react-router-dom';
import { ReservationCreateForm } from '../components/ReservationCreateForm';
import { ReservationDetailsOffcanvas } from '../components/ReservationDetailsOffcanvas';
import { useAuth } from '../AuthContext';

interface Reservation {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  user_id: string;
  resources: Resource & { 
    sites: Site & { 
      teams: Team 
    } 
  };
  participants?: string[];
}

// DateTime utility functions
const formatLocalDateTime = (utcDateTime: string) => {
  const localTime = moment.utc(utcDateTime).local();
  const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${localTime.format('MMMM D, YYYY h:mm A')} (${timezoneName})`;
};

const MyReservations: React.FC = () => {
  const { user } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showSiteDetails, setShowSiteDetails] = useState(false);
  const [showResourceDetails, setShowResourceDetails] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationDetails, setShowReservationDetails] = useState(false);

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchReservations();
    }
  }, [tab, user]); // Add both tab and user as dependencies

  const fetchReservations = async () => {
    if (!user?.id || !user?.email) {
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Fetching for:', { user: user.id, email: user.email });

      const { data: reservationsData, error: reservationsError } = await supabase
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
        .or(`user_id.eq.${user.id},participants.cs.{"${user.email}"}`)
        .throwOnError();

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData);
    } catch (error) {
      console.error('Detailed error:', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const filterReservations = (type: 'past' | 'current' | 'future') => {
    // Get current time in local timezone
    const now = moment().local();
    
    return reservations.filter(reservation => {
      // Convert UTC database times to local for comparison
      const start = moment.utc(reservation.start_time).local();
      const end = moment.utc(reservation.end_time).local();
  
      switch (type) {
        case 'past':
          return end.isBefore(now);
        case 'current':
          return start.isBefore(now) && end.isAfter(now);
        case 'future':
          return start.isAfter(now);
        default:
          return false;
      }
    });
  };

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);

    const { data: members, error } = await supabase
      .rpc('get_team_members', {
        _team_id: team.id
      });

    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      setTeamMembers(members);
      setShowTeamDetails(true);
    }
  };

  const isOwner = (reservation: Reservation) => reservation.user_id === user?.id;

  const renderParticipants = (reservation: Reservation) => {
    // Solo reservation
    if (!reservation.participants || reservation.participants.length === 0) {
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
          bg={isOwner(reservation) ? "primary" : "secondary"}
          className="rounded-pill"
          style={{ fontSize: '0.75em' }}
        >
          <i className="fas fa-users me-1"></i>
          {isOwner(reservation) ? 'Owner' : 'Guest'}
        </Badge>
        <div className="d-flex gap-2 flex-wrap">
          {reservation.participants.map((email, index) => (
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

  const renderReservation = (reservation: Reservation) => {
    const start = formatLocalDateTime(reservation.start_time);
    const end = formatLocalDateTime(reservation.end_time);
    
    return (
      <ListGroup.Item key={reservation.id}>
        <div 
          role="button" 
          onClick={() => {
            setSelectedReservation(reservation);
            setShowReservationDetails(true);
          }}
          className="text-primary mb-2 fw-bold"
          style={{ cursor: 'pointer', fontSize: '1.1rem' }}
        >
          {reservation.title}
        </div>
        {reservation.description && <p>{reservation.description}</p>}
        
        <div className="d-flex flex-column flex-md-row mb-2">
          <div className="mb-2 mb-md-0" style={{ width: '80px' }}>
            <small className="text-muted d-block d-md-inline">
              <i className="fas fa-users me-1"></i>Who:
            </small>
          </div>
          <div className="flex-grow-1">
            {renderParticipants(reservation)}
          </div>
        </div>
  
        {reservation.resources && (
          <div className="d-flex flex-column flex-md-row mb-2">
            <div className="mb-2 mb-md-0" style={{ width: '80px' }}>
              <small className="text-muted d-block d-md-inline">
                <i className="fas fa-location-dot me-1"></i>Where:
              </small>
            </div>
            <div className="flex-grow-1">
              {reservation.resources?.name && (
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setSelectedResource(reservation.resources);
                    setShowResourceDetails(true);
                  }}
                >
                  <i className="fas fa-box me-1"></i>
                  {reservation.resources.name}
                </Button>
              )}
              {reservation.resources?.sites?.name && (
                <>
                  {" at "}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => {
                      setSelectedSite(reservation.resources.sites);
                      setShowSiteDetails(true);
                    }}
                  >
                    <i className="fas fa-building me-1"></i>
                    {reservation.resources.sites.name}
                  </Button>
                </>
              )}
              {reservation.resources?.sites?.teams?.name && (
                <>
                  {" ("}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => handleTeamClick(reservation.resources.sites.teams)}
                  >
                    <i className="fas fa-users me-1"></i>
                    {reservation.resources.sites.teams.name}
                  </Button>
                  {")"}
                </>
              )}
            </div>
          </div>
        )}
  
        <div className="d-flex flex-column flex-md-row mb-2">
          <div className="mb-2 mb-md-0" style={{ width: '80px' }}>
            <small className="text-muted d-block d-md-inline">
              <i className="fas fa-clock me-1"></i>When:
            </small>
          </div>
          <div className="flex-grow-1">
            {start} - {end}
          </div>
        </div>
      </ListGroup.Item>
    );
  };

  const renderEmptyMessage = (period: string) => (
    <ListGroup>
    <ListGroup.Item className="text-center py-5 text-muted border-dashed">
      <i className="fas fa-calendar-times mb-3 fa-3x"></i>
      <p className="mb-0 mt-3">No {period} reservations found</p>
    </ListGroup.Item>
  </ListGroup>
  );

  if (isLoading) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  const validTabs = ['current', 'upcoming', 'past'];
  const activeTab = validTabs.includes(tab || '') ? tab : 'current';

  return (
    <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
        <h3><i className="fas fa-calendar-check me-2"></i>My Reservations</h3>

        <Button onClick={() => setShowCreateForm(true)}>
          <i className="fas fa-calendar-plus me-2"></i>Create Reservation
        </Button>

      </div>
      
      <Tabs
        activeKey={tab || 'current'}
        onSelect={(k) => k && navigate(`/myreservations/${k}`)}
        className="mb-3"
      >
        <Tab 
          eventKey="current" 
          title={
            <span>
              Current{' '}
              {filterReservations('current').length > 0 && (
                <Badge bg="primary" pill>
                  {filterReservations('current').length}
                </Badge>
              )}
            </span>
          }
        >
          {filterReservations('current').length > 0 ? (
            <ListGroup>
              {filterReservations('current').map(renderReservation)}
            </ListGroup>
          ) : renderEmptyMessage('current')}
        </Tab>
        <Tab 
          eventKey="upcoming" 
          title={
            <span>
              Upcoming{' '}
              {filterReservations('future').length > 0 && (
                <Badge bg="primary" pill>
                  {filterReservations('future').length}
                </Badge>
              )}
            </span>
          }
        >
          {filterReservations('future').length > 0 ? (
            <ListGroup>
              {filterReservations('future').map(renderReservation)}
            </ListGroup>
          ) : renderEmptyMessage('upcoming')}
        </Tab>
        <Tab eventKey="past" title="Past">
          {filterReservations('past').length > 0 ? (
            <ListGroup>
              {filterReservations('past').map(renderReservation)}
            </ListGroup>
          ) : renderEmptyMessage('past')}
        </Tab>
      </Tabs>


      <SiteDetailsOffcanvas
        show={showSiteDetails}
        onHide={() => setShowSiteDetails(false)}
        site={selectedSite}
        userRole="member"  // Force member view
        onEdit={() => { }}
      />

      <ResourceDetailsOffcanvas
        show={showResourceDetails}
        onHide={() => setShowResourceDetails(false)}
        resource={selectedResource}
        userRole="member"  // Force member view
        onResourceUpdated={() => { }}
        onResourceDeleted={() => { }}
      />

      <TeamDetailsOffcanvas
        show={showTeamDetails}
        onHide={() => setShowTeamDetails(false)}
        selectedTeam={selectedTeam}
        teamUsers={teamMembers}
        editingTeam={{ name: selectedTeam?.name || '', description: selectedTeam?.description || '' }}
        setEditingTeam={() => { }}
        isSavingChanges={false}
        onUpdateTeam={async () => { }}
        onEditClick={() => { }}
        onDeleteClick={() => { }}
        onAddMemberClick={() => { }}
        onRemoveUser={async () => { }}
        onRoleChange={async () => { }}
        onLeaveTeam={async () => { }}
        rolePriority={{ owner: 0, admin: 1, member: 2 }}
        onShowLeaveConfirm={() => { }}
        sites={selectedTeam?.sites || []}
        onAddSite={() => { }}
        onEditSite={() => { }}
        onRemoveSite={async () => { }}
        userRole="member"  // Force member view
      />

      <ReservationCreateForm
        show={showCreateForm}
        onHide={() => setShowCreateForm(false)}
        onReservationCreated={fetchReservations}
      />

        <ReservationDetailsOffcanvas
          show={showReservationDetails}
          onHide={() => setShowReservationDetails(false)}
          reservation={selectedReservation}
          onReservationUpdated={fetchReservations}
          onReservationDeleted={fetchReservations}
          onResourceClick={(resource) => {
            setSelectedResource(resource);
            setShowResourceDetails(true);
          }}
          onSiteClick={(site) => {
            setSelectedSite(site);
            setShowSiteDetails(true);
          }}
        />
    </div>
  );
};

export default MyReservations;