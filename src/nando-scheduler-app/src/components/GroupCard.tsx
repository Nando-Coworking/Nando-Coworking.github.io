import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Group } from '../types/group';

interface GroupCardProps {
  group: Group;
  onManage: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onManage }) => {
  return (
    <Card>
      <Card.Body>
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
        <Card.Text>{group.description}</Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <i className="fas fa-user me-1"></i>
            {group.member_count} members
          </small>
          <Button 
            variant="outline-primary"
            onClick={() => onManage(group)}
          >
            <i className="fas fa-cog me-2"></i>Manage<i className="fas fa-chevron-right ms-2"></i>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};