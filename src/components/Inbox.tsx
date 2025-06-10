
import React, { useState } from 'react';
import { Plus, Inbox as InboxIcon } from 'lucide-react';
import { InboxItem, Task, Project, TaskType } from '../types/task';
import { InboxItemCard } from './InboxItemCard';

interface InboxProps {
  inboxItems: InboxItem[];
  onAddInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  onDeleteInboxItem: (id: string) => void;
  onConvertToTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  projects: Project[];
  taskTypes: TaskType[];
}

function Inbox({ 
  inboxItems, 
  onAddInboxItem, 
  onDeleteInboxItem, 
  onConvertToTask, 
  projects, 
  taskTypes 
}: InboxProps) {
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
            <InboxItemCard
              key={item.id}
              item={item}
              onDeleteInboxItem={onDeleteInboxItem}
              onConvertToTask={onConvertToTask}
              projects={projects}
              taskTypes={taskTypes}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;
