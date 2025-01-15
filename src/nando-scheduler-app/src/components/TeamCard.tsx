import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Team } from '../types/team';

interface TeamCardProps {
  team: Team;
  onManage: (team: Team) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onManage }) => {
  return (
    <Card className="h-100">
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex justify-content-between">
          {team.name}
          <Badge 
            bg={team.user_role === 'owner' ? 'primary' : 
                team.user_role === 'admin' ? 'warning' : 
                'info'}
            text={team.user_role === 'owner' ? undefined : 'dark'}
            className="fw-normal"
            style={{ fontSize: '0.65em' }} 
          >
            <i className={`fas fa-${
              team.user_role === 'owner' ? 'power-off' : 
              team.user_role === 'admin' ? 'lock' : 
              'user'
            } me-1`}></i>
            {team.user_role}
          </Badge>
        </Card.Title>
        <Card.Text className="flex-grow-1 text-truncate-2">
          {team.description}
        </Card.Text>
        <div className="d-flex flex-column flex-sm-row flex-md-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
          <div className="d-flex flex-column flex-sm-row mb-2 mb-lg-0">
            <small className="text-muted me-3">
              <i className="fas fa-user me-1"></i>
              {team.member_count} members
            </small>
            <small className="text-muted">
              <i className="fas fa-building me-1"></i>
              {team.site_count || 0} locations
            </small>
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-end">
        <Button 
          variant="outline-primary"
          onClick={() => onManage(team)}
        >
          <i className="fas fa-cog me-2"></i>Manage<i className="fas fa-chevron-right ms-2"></i>
        </Button>
      </Card.Footer>
    </Card>
  );
};