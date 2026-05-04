import React, { useState } from 'react';
import { TherapeuticGuideline, GuidelineCategory, GuidelineTargetAudience } from '../types';
import { Modal, Button, Input, TextArea, Select } from './ui';
import { Brain, AlertCircle, BookOpen, Users, Utensils } from 'lucide-react';

interface GuidelineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guideline: Partial<TherapeuticGuideline>) => Promise<void>;
  initialData?: TherapeuticGuideline;
}

export const GuidelineFormModal: React.FC<GuidelineFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<TherapeuticGuideline>>(
    initialData || {
      category: 'Behavior',
      title: '',
      trigger: '',
      actionPlan: '',
      avoid: '',
      targetAudience: 'Both'
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving guideline:", error);
      alert("Erro ao salvar a diretriz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Diretriz Terapêutica" : "Nova Diretriz Terapêutica"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
          <p className="text-sm text-blue-800">
            Crie um <strong>Cartão de Resposta Rápida</strong>. Ele será exibido em destaque no aplicativo dos pais e/ou da escola para orientar o manejo no dia a dia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoria"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="Behavior">Comportamento (Crise)</option>
            <option value="Sensory">Sensorial</option>
            <option value="Academic">Pedagógico</option>
            <option value="Social">Social</option>
            <option value="Food">Alimentação</option>
          </Select>

          <Select
            label="Público-Alvo"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            required
          >
            <option value="Both">Pais e Escola</option>
            <option value="Parents">Somente Pais</option>
            <option value="School">Somente Escola</option>
          </Select>
        </div>

        <Input
          label="Título da Diretriz"
          name="title"
          placeholder="Ex: Manejo de Crise Sensorial"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <TextArea
          label="Gatilho (Quando acontecer...)"
          name="trigger"
          placeholder="Ex: O aluno se recusar a guardar o material ou cobrir os ouvidos no recreio."
          value={formData.trigger}
          onChange={handleChange}
          required
          rows={2}
          className="min-h-[80px]"
        />

        <TextArea
          label="Ação: O que fazer"
          name="actionPlan"
          placeholder="Ex: Ofereça duas opções (quer guardar o lápis ou o caderno primeiro?) ou ofereça o abafador."
          value={formData.actionPlan}
          onChange={handleChange}
          required
          rows={3}
          className="min-h-[100px] border-green-200 focus:ring-green-500 bg-green-50/30"
        />

        <TextArea
          label="O que EVITAR"
          name="avoid"
          placeholder="Ex: Não force o contato físico, evite tom de voz elevado."
          value={formData.avoid}
          onChange={handleChange}
          required
          rows={2}
          className="min-h-[80px] border-red-200 focus:ring-red-500 bg-red-50/30"
        />

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Diretriz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
