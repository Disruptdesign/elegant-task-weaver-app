import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { AppUser, TaskAssignment, EventAssignment } from '../types/user';
import { Users, UserPlus, X, Edit2, Check, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const { toast } = useToast();

  // Check if the itemId is a valid UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const isValidItemId = isValidUUID(itemId);

  // Get current user information
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isOpen) return;
      
      try {
        setIsCheckingUser(true);
        console.log('🔍 Getting current user session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          return;
        }

        if (!session?.user) {
          console.log('❌ No session or user found');
          return;
        }

        console.log('✅ Session found, user ID:', session.user.id);
        console.log('📋 Available users:', users.length);

        const currentUserData = users.find(user => user.authUserId === session.user.id);
        
        if (currentUserData) {
          console.log('✅ Current user found in users list:', currentUserData);
          setCurrentUser(currentUserData);
          setNewUsername(currentUserData.username || '');
        } else {
          console.log('❌ Current user NOT found in users list. Auth user ID:', session.user.id);
          console.log('🔍 Users auth IDs:', users.map(u => ({ id: u.id, authUserId: u.authUserId, email: u.email })));
          
          // Try to create the missing user
          console.log('🛠️ Attempting to create missing user record...');
          const { data: newUser, error: createError } = await supabase
            .from('app_users')
            .insert({
              auth_user_id: session.user.id,
              email: session.user.email,
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              username: session.user.user_metadata?.username || null,
              role: 'member',
              is_active: true
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user record:', createError);
          } else {
            console.log('✅ Created user record:', newUser);
            // Refresh the users list
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('❌ Error in getCurrentUser:', error);
      } finally {
        setIsCheckingUser(false);
      }
    };

    if (isOpen && users.length > 0) {
      getCurrentUser();
    }
  }, [isOpen, users]);

  const availableUsers = users.filter(
    user => !assignments.some(assignment => assignment.userId === user.id)
  );

  const isCurrentUserAssigned = currentUser && assignments.some(assignment => assignment.userId === currentUser.id);

  console.log('🎯 UserAssignmentDialog state:', {
    isOpen,
    type,
    itemId,
    isValidItemId,
    currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, username: currentUser.username } : null,
    isCurrentUserAssigned,
    assignmentsCount: assignments.length,
    usersCount: users.length,
    availableUsersCount: availableUsers.length,
    isCheckingUser
  });

  const handleRefreshUsers = async () => {
    try {
      setIsCheckingUser(true);
      window.location.reload();
    } catch (error) {
      console.error('❌ Error refreshing:', error);
      setIsCheckingUser(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedRole) return;

    if (!isValidItemId) {
      toast({
        title: "Assignation impossible",
        description: `Cette ${type === 'task' ? 'tâche' : 'événement'} ne peut pas être assignée car elle utilise un identifiant de démonstration.`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('👤 Assigning user:', { selectedUserId, selectedRole, itemId, type });
      setIsAssigning(true);
      await onAssignUser(selectedUserId, selectedRole);
      setSelectedUserId('');
      setSelectedRole('');
      toast({
        title: "Utilisateur assigné",
        description: "L'utilisateur a été assigné avec succès.",
      });
    } catch (error) {
      console.error('❌ Error assigning user:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'assigner l'utilisateur.";
      toast({
        title: "Erreur d'assignation",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSelfAssign = async () => {
    if (!currentUser) {
      console.error('❌ Cannot self-assign: no current user');
      toast({
        title: "Erreur",
        description: "Impossible de vous identifier. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidItemId) {
      toast({
        title: "Auto-assignation impossible",
        description: `Cette ${type === 'task' ? 'tâche' : 'événement'} de démonstration ne peut pas être assignée. Les assignations ne fonctionnent qu'avec les ${type === 'task' ? 'tâches' : 'événements'} que vous créez.`,
        variant: "destructive",
      });
      return;
    }

    const defaultRole = type === 'task' ? 'assignee' : 'attendee';
    
    try {
      console.log('🎯 Self-assigning user:', { 
        userId: currentUser.id, 
        role: defaultRole, 
        itemId, 
        type,
        currentUser: { id: currentUser.id, email: currentUser.email }
      });
      
      setIsAssigning(true);
      await onAssignUser(currentUser.id, defaultRole);
      
      toast({
        title: "Auto-assignation réussie",
        description: `Vous avez été assigné à ce ${type === 'task' ? 'tâche' : 'événement'}.`,
      });
    } catch (error) {
      console.error('❌ Error self-assigning:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur d'auto-assignation",
        description: `Impossible de vous auto-assigner. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      console.log('🗑️ Removing assignment:', { userId, itemId, type });
      await onRemoveAssignment(userId);
      toast({
        title: "Assignation supprimée",
        description: "L'assignation a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('❌ Error removing assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'assignation.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUsername = async () => {
    if (!currentUser || !newUsername.trim()) return;

    try {
      setIsUpdatingUsername(true);
      const { error } = await supabase
        .from('app_users')
        .update({ username: newUsername.trim() })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Pseudo mis à jour",
        description: "Votre pseudo a été modifié avec succès.",
      });
      setEditingUsername(false);
      
      // Update current user state
      setCurrentUser({ ...currentUser, username: newUsername.trim() });
    } catch (error: any) {
      console.error('Error updating username:', error);
      if (error.code === '23505') {
        toast({
          title: "Pseudo déjà utilisé",
          description: "Ce pseudo est déjà pris par un autre utilisateur.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le pseudo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdatingUsername(false);
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
    
    if (user.username) return user.username;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Assigner des utilisateurs - {itemTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning for demo items */}
          {!isValidItemId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="space-y-2">
                  <h3 className="font-medium text-amber-900">
                    {type === 'task' ? 'Tâche' : 'Événement'} de démonstration
                  </h3>
                  <p className="text-sm text-amber-800">
                    Cette {type === 'task' ? 'tâche' : 'événement'} est un exemple et ne peut pas être assignée. 
                    Les assignations ne fonctionnent qu'avec les {type === 'task' ? 'tâches' : 'événements'} que vous créez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section profil utilisateur actuel */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2 text-blue-900">
              <UserCheck size={18} />
              Mon profil
              {isCheckingUser && <RefreshCw size={14} className="animate-spin" />}
            </h3>
            
            {!currentUser ? (
              <div className="space-y-3">
                <div className="text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span>⚠️</span>
                    <span className="font-medium">Problème d'identification</span>
                  </div>
                  <p>Votre compte n'est pas encore synchronisé avec l'application.</p>
                </div>
                
                <Button 
                  onClick={handleRefreshUsers}
                  disabled={isCheckingUser}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCheckingUser ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Synchroniser mon compte
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Debug info */}
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Debug: User ID: {currentUser.id} | Email: {currentUser.email} | Username: {currentUser.username || 'None'}
                </div>

                {/* Username editing */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900 min-w-[60px]">Pseudo:</span>
                  {editingUsername ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Entrez votre pseudo"
                        className="flex-1 h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateUsername();
                          if (e.key === 'Escape') {
                            setEditingUsername(false);
                            setNewUsername(currentUser.username || '');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateUsername}
                        disabled={isUpdatingUsername || !newUsername.trim()}
                        className="h-8 w-8 p-0"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUsername(false);
                          setNewUsername(currentUser.username || '');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-blue-800">
                        {currentUser.username || 'Aucun pseudo défini'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingUsername(true)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={12} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Self assignment */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    {isCurrentUserAssigned 
                      ? `Vous êtes assigné à ce ${type === 'task' ? 'tâche' : 'événement'}`
                      : `Vous n'êtes pas assigné à ce ${type === 'task' ? 'tâche' : 'événement'}`
                    }
                  </span>
                  {!isCurrentUserAssigned && isValidItemId && (
                    <Button
                      size="sm"
                      onClick={handleSelfAssign}
                      disabled={isAssigning}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isAssigning ? 'Assignation...' : 'M\'assigner'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ajouter un nouvel utilisateur */}
          {isValidItemId && (
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
                            {user.username || (user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email)
                            }
                          </span>
                          {(user.username || (user.firstName && user.lastName)) && (
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
          )}

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
                          {currentUser && assignment.userId === currentUser.id && (
                            <span className="text-blue-600 text-sm ml-1">(Vous)</span>
                          )}
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
                    {isValidItemId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(assignment.userId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X size={16} />
                      </Button>
                    )}
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
