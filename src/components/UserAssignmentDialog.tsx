
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { AppUser, TaskAssignment, EventAssignment } from '../types/user';
import { Users, UserPlus, X } from 'lucide-react';

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

export function UserAssignmentDialog({
  isOpen,
  onClose,
  type,
  itemId,
  itemTitle,
  users,
  assignments,
  onAssignUser,
  onRemoveAssignment,
}: UserAssignmentDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const availableUsers = users.filter(
    user => !assignments.some(assignment => assignment.userId === user.id)
  );

  const handleAssign = async () => {
    if (!selectedUserId || !selectedRole) return;

    try {
      setIsAssigning(true);
      await onAssignUser(selectedUserId, selectedRole);
      setSelectedUserId('');
      setSelectedRole('');
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await onRemoveAssignment(userId);
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  const getRoleOptions = () => {
    if (type === 'task') {
      return [
        { value: 'assignee', label: 'Assigné' },
        { value: 'reviewer', label: 'Réviseur' },
        { value: 'observer', label: 'Observateur' },
      ];
    } else {
      return [
        { value: 'organizer', label: 'Organisateur' },
        { value: 'attendee', label: 'Participant' },
        { value: 'optional', label: 'Optionnel' },
      ];
    }
  };

  const getRoleLabel = (role: string) => {
    const option = getRoleOptions().find(opt => opt.value === role);
    return option?.label || role;
  };

  const getUserDisplayName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Utilisateur inconnu';
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Assigner des utilisateurs - {itemTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ajouter un nouvel utilisateur */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <UserPlus size={18} />
              Ajouter un utilisateur
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </span>
                        {user.firstName && user.lastName && (
                          <span className="text-xs text-gray-500">{user.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAssign}
                disabled={!selectedUserId || !selectedRole || isAssigning}
                className="w-full"
              >
                {isAssigning ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>

          {/* Liste des utilisateurs assignés */}
          <div className="space-y-4">
            <h3 className="font-medium">
              Utilisateurs assignés ({assignments.length})
            </h3>
            
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun utilisateur assigné pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {assignments.map(assignment => (
                  <div 
                    key={assignment.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {getUserDisplayName(assignment.userId)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {users.find(u => u.id === assignment.userId)?.email}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {getRoleLabel(assignment.role)}
                      </Badge>
                      {type === 'event' && 'responseStatus' in assignment && (
                        <Badge 
                          variant={
                            assignment.responseStatus === 'accepted' ? 'default' :
                            assignment.responseStatus === 'declined' ? 'destructive' :
                            assignment.responseStatus === 'maybe' ? 'secondary' :
                            'outline'
                          }
                        >
                          {assignment.responseStatus === 'accepted' && 'Accepté'}
                          {assignment.responseStatus === 'declined' && 'Refusé'}
                          {assignment.responseStatus === 'maybe' && 'Peut-être'}
                          {assignment.responseStatus === 'pending' && 'En attente'}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(assignment.userId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
