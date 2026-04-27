// src/components/BottomNavBar.tsx
import React from 'react';

interface NavItem {
    label: string;
    icon: string;
    viewKey: string;
}

interface BottomNavBarProps {
    currentView: string;
    onChangeView: (viewKey: string) => void;
}

// Definição dos itens de navegação (baseado na imagem image_784276.png)
const navItems: NavItem[] = [
    { label: 'Início', icon: '🏠', viewKey: 'dashboard' }, // Usando 🏠 para simbolizar Início/Dashboard
    { label: 'Diário', icon: '📖', viewKey: 'diary' },
    { label: 'Saúde', icon: '❤️', viewKey: 'health' },
    { label: 'Rotinas', icon: '📋', viewKey: 'routines' },
    { label: 'Docs', icon: '📄', viewKey: 'documents' },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, onChangeView }) => {
    return (
        // Estilização para barra fixa no rodapé
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 p-1">
            <div className="flex justify-around items-center h-16 max-w-xl mx-auto">
                {navItems.map((item) => {
                    // Determina se o item atual é a visualização ativa
                    const isActive = currentView === item.viewKey;
                    
                    return (
                        <button
                            key={item.viewKey}
                            onClick={() => onChangeView(item.viewKey)}
                            className={`
                                flex flex-col items-center p-1 rounded-lg transition-colors 
                                ${isActive 
                                    ? 'text-pink-600 font-bold' // Cor de destaque para o link ativo
                                    : 'text-slate-500 hover:text-slate-700'
                                }
                            `}
                        >
                            <span className="text-2xl mb-0.5" role="img" aria-label={item.label}>
                                {/* Aqui você usaria o ícone real (ex: de uma biblioteca como Heroicons) */}
                                {item.icon}
                            </span>
                            <span className="text-xs">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavBar;