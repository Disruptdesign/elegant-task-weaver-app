
import React from 'react';
import { AppUser, TaskAssignment, EventAssignment } from '../types/user';
import { UserAssignmentManager } from './UserAssignmentManager';

interface UserAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'event';
  itemId: string;
  itemTitle: string;
  users: AppUser[];
  assignments: (TaskAssignment | EventAssignment)[];
  onAssignUser: (userId: string, role: string) => Promise<void>;
  onRemoveAssignment: (userId: string) => Promise<void>;
}

export function UserAssignmentDialog(props: UserAssignmentDialogProps) {
  // This component now simply wraps the new UserAssignmentManager
  // The assignments prop is no longer used as the manager fetches its own data
  return (
    <UserAssignmentManager
      isOpen={props.isOpen}
      onClose={props.onClose}
      type={props.type}
      itemId={props.itemId}
      itemTitle={props.itemTitle}
      users={props.users}
      onAssignUser={props.onAssignUser}
    />
  );
}
