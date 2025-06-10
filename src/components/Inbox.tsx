
import React, { useState } from 'react';
import { Plus, Inbox as InboxIcon, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { InboxItem } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface InboxProps {
  inboxItems: InboxItem[];
  onAddInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  onDeleteInboxItem: (id: string) => void;
  onConvertToTask: (item: InboxItem) => void;
}

function Inbox({ inboxItems, onAddInboxItem, onDeleteInboxItem, onConvertToTask }: InboxProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddInboxItem({
      title: title.trim(),
      description: description.trim() || undefined,
    });

    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground flex items-center gap-3">
          <InboxIcon className="text-foreground" size={32} />
          Inbox
        </h1>
        <p className="text-muted-foreground mt-2">
          Ajoutez rapidement vos idées de tâches à planifier plus tard
        </p>
      </div>

      {/* Formulaire d'ajout rapide */}
      <div className="card-base spacing-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qu'avez-vous en tête ?"
              className="text-unified-lg"
              required
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails optionnels..."
              rows={2}
              className="input-base resize-none"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="default"
          >
            <Plus size={16} />
            Ajouter à l'inbox
          </Button>
        </form>
      </div>

      {/* Liste des éléments */}
      <div className="space-y-4">
        {inboxItems.length === 0 ? (
          <div className="text-center py-12 card-base">
            <InboxIcon className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-unified-lg font-medium text-foreground mb-2">
              Votre inbox est vide
            </h3>
            <p className="text-muted-foreground">
              Commencez par ajouter vos premières idées de tâches
            </p>
          </div>
        ) : (
          inboxItems.map(item => (
            <div
              key={item.id}
              className="card-base spacing-md hover:shadow-unified-md transition-unified group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-unified-sm text-muted-foreground mb-2">{item.description}</p>
                  )}
                  <p className="text-unified-xs text-muted-foreground">
                    Ajouté le {format(item.createdAt, 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => onConvertToTask(item)}
                    variant="info"
                    size="sm"
                  >
                    <ArrowRight size={12} />
                    Planifier
                  </Button>
                  <Button
                    onClick={() => onDeleteInboxItem(item.id)}
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;
