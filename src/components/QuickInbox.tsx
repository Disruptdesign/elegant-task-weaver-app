
import React, { useState } from 'react';
import { Plus, Inbox as InboxIcon } from 'lucide-react';
import { InboxItem } from '../types/task';

interface QuickInboxProps {
  onAddInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
}

export function QuickInbox({ onAddInboxItem }: QuickInboxProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddInboxItem({
      title: title.trim(),
    });

    setTitle('');
  };

  return (
    <div className="p-3 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <InboxIcon size={16} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Ajout rapide</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une idée..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </form>
    </div>
  );
}
