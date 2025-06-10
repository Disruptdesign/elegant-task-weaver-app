
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { Event } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { DateTimeSelector } from './ui/datetime-selector';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingEvent?: Event;
  inline?: boolean; // Nouveau prop pour le mode inline
  onCancel?: () => void; // Nouvelle fonction pour gérer l'annulation en mode inline
}

export function EventForm({
  isOpen,
  onClose,
  onSubmit,
  editingEvent,
  inline = false,
  onCancel
}: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    allDay: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        startDate: new Date(editingEvent.startDate),
        endDate: new Date(editingEvent.endDate),
        location: editingEvent.location || '',
        allDay: editingEvent.allDay || false
      });
    } else {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startDate: now,
        endDate: oneHourLater,
        location: '',
        allDay: false
      });
    }
  }, [editingEvent]);

  // Fonction pour gérer l'annulation
  const handleCancel = () => {
    if (inline && onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location.trim() || undefined,
        allDay: formData.allDay
      });
      if (!inline) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contenu du formulaire
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Titre de l'événement *
        </label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Entrez le titre de l'événement"
          required
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de l'événement (optionnel)"
          rows={3}
          className="w-full"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allDay"
          checked={formData.allDay}
          onCheckedChange={(checked) => setFormData({ ...formData, allDay: !!checked })}
        />
        <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
          Événement de toute la journée
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de début *
          </label>
          <DateTimeSelector
            value={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date || new Date() })}
            includeTime={!formData.allDay}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de fin *
          </label>
          <DateTimeSelector
            value={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date || new Date() })}
            includeTime={!formData.allDay}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin size={14} className="inline mr-1" />
          Lieu
        </label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Lieu de l'événement (optionnel)"
          className="w-full"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.title.trim()}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </div>
          ) : (
            <>
              <Calendar size={16} />
              {editingEvent ? 'Modifier' : 'Créer'} l'événement
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // Si on est en mode inline, on retourne juste le contenu du formulaire
  if (inline) {
    return formContent;
  }

  // Mode modal normal
  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      {formContent}
    </div>
  );
}
