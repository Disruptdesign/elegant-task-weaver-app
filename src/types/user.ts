
export interface AppUser {
  id: string;
  authUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  username?: string;
  role: 'admin' | 'manager' | 'member';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: 'assignee' | 'reviewer' | 'observer';
  assignedAt: Date;
  assignedBy?: string;
  user?: AppUser;
}

export interface EventAssignment {
  id: string;
  eventId: string;
  userId: string;
  role: 'organizer' | 'attendee' | 'optional';
  assignedAt: Date;
  assignedBy?: string;
  responseStatus: 'pending' | 'accepted' | 'declined' | 'maybe';
  user?: AppUser;
}
