// src/components/CrisisForm.tsx
import React, { useState } from 'react';
import { addCrisisOffline } from '../services/crisisService';
import { Button } from './ui';
import { AlertTriangle, Send } from 'lucide-react';

export const CrisisForm: React.FC<{ userId: string }> = ({ userId }) => {
  const [type, setType] = useState('Sensorial');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addCrisisOffline({
        userId,
        type,
        description,
        timestamp: Date.now(),
        synced: false,
      });
      setMessage('Crise registrada (offline). Será enviada ao conectar ao Wi‑Fi.');
      setDescription('');
    } catch (err) {
      console.error(err);
      setMessage('Erro ao registrar crise.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200 mt-6">
      <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" /> Registrar Crise
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded"
          >
            <option value="Sensorial">Sensorial</option>
            <option value="Emocional">Emocional</option>
            <option value="Físico">Físico</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded resize-none"
            placeholder="Descreva brevemente o que aconteceu..."
          />
        </div>
        <Button type="submit" disabled={submitting} className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando...' : 'Registrar'}
        </Button>
        {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
      </form>
    </div>
  );
};
