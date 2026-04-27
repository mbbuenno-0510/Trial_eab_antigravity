import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Image, Download, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { StoredDocument } from '../types';

// O PDF.JS e PDFRenderer não são mais necessários para renderização, mas mantive as importações não usadas
// para referência e para manter o código próximo ao original.
// import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'; 
// GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.449/build/pdf.worker.mjs'; 

// ===============================================
// TIPOS E PROPS
// ===============================================

interface DocumentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: StoredDocument | null;
}

// O componente PDFRenderer não é mais usado, mas deixado aqui para referência
/*
const PDFRenderer: React.FC<any> = ({ dataUrl, onLoad, onError }) => {
    // ... (Código do PDFRenderer, agora IGNORADO)
    return <div className="p-4 text-center text-slate-500">Renderização desativada.</div>;
};
*/

// ===============================================
// COMPONENTE: DocumentViewModal
// ===============================================

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({ isOpen, onClose, document }) => {
    // Mantemos isLoading apenas para o carregamento da imagem, se houver.
    const [isLoading, setIsLoading] = useState(true);
    // Não precisamos mais de renderError para PDF, mas mantemos para imagens ou outros erros.
    const [renderError, setRenderError] = useState<string | null>(null);

    // Reset loading and error states when document changes or modal opens
    useEffect(() => {
        if (isOpen && document) {
            setIsLoading(true);
            setRenderError(null);
            
            // 🚨 NOVO: Se for PDF, desliga o loader imediatamente, pois não haverá renderização.
            if (document.mimeType?.includes('pdf')) {
                setIsLoading(false);
            }
        }
    }, [isOpen, document]);

    if (!isOpen || !document) return null;

    const fileUrl = document.downloadUrl || document.dataUrl || '';
    const isDataMissing = !fileUrl;
    
    const isPDF = document.mimeType?.includes('pdf');
    const isImage = document.mimeType?.includes('image');

    const Icon = isPDF ? FileText : isImage ? Image : FileText;
    const mimeDescription = isPDF ? 'Documento PDF' : isImage ? 'Imagem' : 'Arquivo';
    
    // Função robusta para "Expandir" (Abrir em nova aba)
    const handleExpand = () => {
        if (!fileUrl) return;
        
        if (fileUrl.startsWith('http')) {
            window.open(fileUrl, '_blank');
            return;
        }

        // Fallback para Base64 legado (mantido por segurança)
        try {
            const base64Data = fileUrl.includes(',') ? fileUrl.split(',')[1] : fileUrl;
            const binary = atob(base64Data);
            const array = [];
            for (let i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            const blob = new Blob([new Uint8Array(array)], { type: document.mimeType });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (e) {
            console.error("Erro ao expandir documento via Blob, usando fallback de Data URL:", e);
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
                
                {/* Header Elegante */}
                <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isPDF ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-slate-800 truncate leading-tight">{document.title}</h2>
                            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                                {mimeDescription} • {document.filename}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Corpo do Conteúdo (Área de Pré-visualização) */}
                <div className={`flex-grow overflow-y-auto bg-slate-100 relative ${isPDF ? 'p-0' : 'p-6 flex items-center justify-center'}`}>
                    
                    {isDataMissing && (
                        <div className="text-center p-8">
                            <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
                            <p className="text-red-700 font-bold">Conteúdo indisponível</p>
                            <p className="text-xs text-slate-500 mt-1">O arquivo parece estar corrompido ou inacessível.</p>
                        </div>
                    )}
                    
                    {/* Loader Condicional (Apenas para Imagens, pois PDF foi desativado) */}
                    {isLoading && !isDataMissing && isImage && !renderError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-[1px] z-20">
                            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-slate-200">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                                <p className="text-slate-700 font-medium">Carregando...</p>
                                <p className="text-xs text-slate-400 mt-1">Renderizando documento.</p>
                            </div>
                        </div>
                    )}

                    {/* Renderização de Imagem */}
                    {!isDataMissing && isImage && (
                        <img 
                            src={fileUrl} 
                            alt={document.title} 
                            onLoad={() => setIsLoading(false)}
                            onError={() => { setIsLoading(false); setRenderError("Erro ao carregar imagem."); }}
                            className={`max-w-full max-h-full rounded-lg shadow-sm object-contain ${isLoading ? 'hidden' : 'block'}`}
                        />
                    )}

                    {/* 🚨 NOVA LÓGICA: Exibição da Mensagem de Expandir para PDF */}
                    {!isDataMissing && isPDF && (
                        <div className="text-center p-8 bg-white/70 backdrop-blur-[1px] h-full flex flex-col items-center justify-center">
                            <FileText className="w-16 h-16 mx-auto text-red-500 mb-3" />
                            <p className="text-red-700 font-bold">Não foi possível visualizar aqui.</p>
                            <p className="text-sm text-slate-600 mt-1">A pré-visualização no aplicativo está desativada.</p>
                            <p className="text-sm text-slate-500 mt-4">Use o botão **"Expandir"** abaixo para abri-lo em uma nova aba.</p>
                        </div>
                    )}
                    
                    {/* Exibição de Erro de Renderização de Imagem ou Erro Genérico */}
                    {renderError && !isPDF && (
                         <div className="text-center p-8">
                            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                            <p className="text-red-700 font-bold">Erro de Visualização</p>
                            <p className="text-xs text-slate-600 mt-1">{renderError}</p>
                            <p className="text-xs text-slate-500 mt-4">Tente usar o botão **"Expandir"** para abrir em uma nova aba.</p>
                        </div>
                    )}

                    {!isDataMissing && !isImage && !isPDF && (
                        <div className="text-center p-8">
                            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-600 font-medium">Visualização não suportada para este formato.</p>
                            <p className="text-xs text-slate-400 mt-2">Use o botão "Baixar" abaixo.</p>
                        </div>
                    )}
                </div>
                
                {/* Footer com Ações */}
                <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] flex-shrink-0">
                    <a
                        href={fileUrl}
                        download={document.filename}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl text-sm font-bold transition-colors"
                    >
                        <Download className="w-4 h-4" /> Baixar
                    </a>
                    
                    <button
                        onClick={handleExpand}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <ExternalLink className="w-4 h-4" /> Expandir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewModal;