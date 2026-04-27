
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { X, FileText, UploadCloud, Loader2, Calendar } from 'lucide-react';
import { StoredDocument } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (title: string, category: string, file: File | null, sharedWithHealth: boolean, documentDate: string, expiryDate: string, isEditing: boolean) => Promise<void>;
  initialData?: StoredDocument | null;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, initialData }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sharedWithHealth, setSharedWithHealth] = useState(false);
  const [documentDate, setDocumentDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(initialData.category || '');
      setSharedWithHealth(!!initialData.sharedWithHealth);
      setDocumentDate(initialData.documentDate || '');
      setExpiryDate(initialData.expiryDate || '');
    } else {
      setTitle('');
      setCategory('');
      setSharedWithHealth(false);
      setDocumentDate(new Date().toISOString().split('T')[0]);
      setExpiryDate('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validação de tamanho: 10MB
      if (file.size > 10 * 1024 * 1024) {
          alert("O arquivo é muito grande. O limite máximo é 10MB.");
          e.target.value = '';
          setSelectedFile(null);
          return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !category || (!selectedFile && !initialData)) {
      alert('Por favor, preencha todos os campos e selecione um arquivo.');
      return;
    }

    setIsUploading(true);
    try {
        await onUpload(title, category, selectedFile, sharedWithHealth, documentDate, expiryDate, !!initialData);
        
        // Reset e fecha apenas se sucesso
        setTitle('');
        setCategory('');
        setSharedWithHealth(false);
        setDocumentDate('');
        setExpiryDate('');
        setSelectedFile(null);
        onClose();
    } catch (error) {
        console.error("Erro no modal de upload:", error);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {initialData ? <UploadCloud className="w-5 h-5 text-blue-600" /> : <UploadCloud className="w-5 h-5 text-blue-600" />}
            {initialData ? 'Editar Documento' : 'Inserir Novo Documento'}
          </h2>
          <button onClick={onClose} disabled={isUploading} className="text-slate-400 hover:text-slate-700 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Título do Documento</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Ex: Laudo Médico 2024"
              required
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
              required
              disabled={isUploading}
            >
              <option value="" disabled>Selecione uma categoria</option>
              <option value="Escolares">Escolares</option>
              <option value="Documentos Pessoais">Documentos Pessoais</option>
              <option value="Médicos">Médicos</option>
              <option value="Financeiros">Financeiros</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {(category === 'Médicos' || category === 'Medical') && (
            <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800">Compartilhar com Médicos?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={sharedWithHealth}
                  onChange={(e) => setSharedWithHealth(e.target.checked)}
                  disabled={isUploading}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data do Doc.</label>
              <div className="relative">
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full p-2 pl-8 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiração</label>
              <div className="relative">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2 pl-8 border border-slate-300 rounded-lg text-xs focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo {initialData && '(Opcional para alteração)'}</label>
            <label className={`flex items-center justify-center w-full h-24 p-4 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition duration-150 relative overflow-hidden ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {selectedFile ? (
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[200px] z-10"><FileText className="w-4 h-4 inline mr-2"/>{selectedFile.name}</p>
                    ) : initialData ? (
                        <p className="text-sm font-medium text-slate-500 truncate max-w-[200px] z-10"><FileText className="w-4 h-4 inline mr-2"/>{initialData.filename}</p>
                    ) : (
                        <>
                            <UploadCloud className="w-6 h-6 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                            <p className="text-xs text-slate-500">PDF, JPG, PNG</p>
                        </>
                    )}
                </div>
                <input id="file" type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isUploading} />
            </label>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={!title || !category || (!selectedFile && !initialData) || isUploading}
          >
            {isUploading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Salvando...
                </>
            ) : (
                initialData ? 'Atualizar Documento' : 'Salvar Documento'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default UploadModal;
