
import React, { useState } from 'react';
import { Plus, Inbox as InboxIcon, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { InboxItem } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InboxProps {
  inboxItems: InboxItem[];
  onAddInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  onDeleteInboxItem: (id: string) => void;
  onConvertToTask: (item: InboxItem) => void;
}

export function Inbox({ inboxItems, onAddInboxItem, onDeleteInboxItem, onConvertToTask }: InboxProps) {
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <InboxIcon className="text-blue-600" size={32} />
          Inbox
        </h1>
        <p className="text-gray-600 mt-2">
          Ajoutez rapidement vos idées de tâches à planifier plus tard
        </p>
      </div>

      {/* Formulaire d'ajout rapide */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qu'avez-vous en tête ?"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails optionnels..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus size={16} />
            Ajouter à l'inbox
          </button>
        </form>
      </div>

      {/* Liste des éléments */}
      <div className="space-y-4">
        {inboxItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <InboxIcon className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Votre inbox est vide
            </h3>
            <p className="text-gray-600">
              Commencez par ajouter vos premières idées de tâches
            </p>
          </div>
        ) : (
          inboxItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Ajouté le {format(item.createdAt, 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onConvertToTask(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
                  >
                    <ArrowRight size={12} />
                    Planifier
                  </button>
                  <button
                    onClick={() => onDeleteInboxItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
