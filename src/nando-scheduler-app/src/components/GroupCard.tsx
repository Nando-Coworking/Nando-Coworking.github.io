import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Group } from '../types/group';

interface GroupCardProps {
  group: Group;
  onManage: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onManage }) => {
  return (
    <Card className="h-100">
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex justify-content-between">
          {group.name}
          <Badge 
            bg={group.user_role === 'owner' ? 'primary' : 
                group.user_role === 'admin' ? 'warning' : 
                'info'}
            text={group.user_role === 'owner' ? undefined : 'dark'}
          >
            <i className={`fas fa-${
              group.user_role === 'owner' ? 'power-off' : 
              group.user_role === 'admin' ? 'lock' : 
              'user'
            } me-1`}></i>
            {group.user_role}
          </Badge>
        </Card.Title>
        <Card.Text className="flex-grow-1 text-truncate-2">
          {group.description}
        </Card.Text>
        <div className="d-flex flex-column flex-sm-row flex-md-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
          <div className="d-flex flex-column flex-sm-row mb-2 mb-lg-0">
            <small className="text-muted me-3">
              <i className="fas fa-user me-1"></i>
              {group.member_count} members
            </small>
            <small className="text-muted">
              <i className="fas fa-building me-1"></i>
              {group.site_count || 0} locations
            </small>
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-end">
        <Button 
          variant="outline-primary"
          onClick={() => onManage(group)}
        >
          <i className="fas fa-cog me-2"></i>Manage<i className="fas fa-chevron-right ms-2"></i>
        </Button>
      </Card.Footer>
    </Card>
  );
};