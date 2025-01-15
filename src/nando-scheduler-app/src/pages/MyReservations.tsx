import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import moment from 'moment';
import { supabase } from '../supabaseClient';
import { Site } from '../types/site';
import { Resource } from '../types/resource';
import { Team } from '../types/team';
import { SiteDetailsOffcanvas } from '../components/SiteDetailsOffcanvas';
import { ResourceDetailsOffcanvas } from '../components/ResourceDetailsOffcanvas';
import { TeamDetailsOffcanvas } from '../components/TeamDetailsOffcanvas';
import { useParams, useNavigate } from 'react-router-dom';

interface Reservation {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  resources: Resource & { sites: Site & { teams: Team } };
}

const MyReservations: React.FC = () => {
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

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            resources (
              *,
              sites (
                *,
                teams (
                  *,
                  team_users (
                    id,
                    role,
                    user_id
                  ),
                  sites (
                    id,
                    name,
                    description,
                    city,
                    state,
                    postal_code
                  )
                )
              )
            )
          `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReservations = (type: 'past' | 'current' | 'future') => {
    const now = moment();
    return reservations.filter(reservation => {
      const start = moment(reservation.start_time);
      const end = moment(reservation.end_time);

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

  const renderReservation = (reservation: Reservation) => (
    <ListGroup.Item key={reservation.id}>
      <strong>{reservation.title}</strong>
      <p>{reservation.description}</p>
      <p>
        <Button
          variant="link"
          className="p-0 me-2"
          onClick={() => {
            setSelectedResource(reservation.resources);
            setShowResourceDetails(true);
          }}
        >
          <i className="fas fa-box me-1"></i>{reservation.resources.name}
        </Button>
        {" at "}
        <Button
          variant="link"
          className="p-0 me-2"
          onClick={() => {
            setSelectedSite(reservation.resources.sites);
            setShowSiteDetails(true);
          }}
        >
          <i className="fas fa-building me-1"></i>{reservation.resources.sites.name}
        </Button>
        {" via "}
        <Button
          variant="link"
          className="p-0"
          onClick={() => handleTeamClick(reservation.resources.sites.teams)}
        >
          <i className="fas fa-users me-1"></i>{reservation.resources.sites.teams.name}
        </Button>
      </p>
      <p>
        {moment(reservation.start_time).format('LLL')} - {moment(reservation.end_time).format('LLL')}
      </p>
    </ListGroup.Item>
  );

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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3><i className="fas fa-calendar-check me-2"></i>My Reservations</h3>

        <Button onClick={() => false} disabled>
          <i className="fas fa-calendar-plus me-2"></i>Create Reservation
        </Button>

      </div>
      <Tabs
        activeKey={activeTab}
        className="mb-3"
        onSelect={(k) => navigate(`/myreservations/${k}`)}
      >
        <Tab
          eventKey="current"
          title={<span><i className="fas fa-clock me-2"></i>Current</span>}
        >
          {filterReservations('current').length > 0 ? (
            <ListGroup>
              {filterReservations('current').map(renderReservation)}
            </ListGroup>
          ) : renderEmptyMessage('current')}
        </Tab>
        <Tab
          eventKey="upcoming"
          title={<span><i className="fas fa-clock-rotate-left fa-flip-horizontal me-2"></i>Upcoming</span>}
        >
          {filterReservations('future').length > 0 ? (
            <ListGroup>
              {filterReservations('future').map(renderReservation)}
            </ListGroup>
          ) : renderEmptyMessage('upcoming')}
        </Tab>
        <Tab
          eventKey="past"
          title={<span><i className="fas fa-history me-2"></i>Past</span>}
        >
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
    </div>
  );
};

export default MyReservations;