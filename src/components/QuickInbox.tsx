
import React, { useState } from 'react';
import { Plus, Inbox as InboxIcon } from 'lucide-react';
import { InboxItem } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
    <div className="spacing-sm border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <InboxIcon size={16} className="text-muted-foreground" />
        <span className="text-unified-sm font-medium text-foreground">Ajout rapide</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une idée..."
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full"
        >
          <Plus size={14} />
          Ajouter
        </Button>
      </form>
    </div>
  );
}
