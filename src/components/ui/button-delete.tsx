'use client';

import { Trash2 } from 'lucide-react'; // Certifique-se de ter lucide-react instalado

interface DeleteButtonProps {
  onDelete: () => void;
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (confirm('Deseja realmente excluir este item?')) {
          onDelete();
        }
      }}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      title="Excluir item"
    >
      <Trash2 size={18} />
    </button>
  );
}