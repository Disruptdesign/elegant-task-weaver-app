
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
    <div className="p-xl border-t border-border bg-card">
      <div className="flex items-center gap-md mb-lg">
        <InboxIcon size={16} className="text-muted-foreground" />
        <span className="text-label-md text-foreground">Ajout rapide</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une idée..."
          className="w-full"
        />
        <Button
          type="submit"
          size="sm"
          className="w-full gap-sm"
        >
          <Plus size={14} />
          Ajouter
        </Button>
      </form>
    </div>
  );
}
