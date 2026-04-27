import React from 'react';

interface Terapia {
  id: string;
  dia: string;
  horario: string;
  nome: string;
  alarme: string;
  isHoje: boolean;
}

const terapias: Terapia[] = [
  { id: '1', dia: 'Segunda-feira', horario: '14:00', nome: 'Fonoaudiologia', alarme: '13:30', isHoje: false },
  { id: '2', dia: 'Quarta-feira', horario: '09:00', nome: 'Psicóloga', alarme: '08:30', isHoje: true },
];

// Funções de manipulação (seriam implementadas na aplicação real)
const handleEdit = (id: string) => {
  console.log(`Abrir modal/tela de edição para a terapia: ${id}`);
  // Lógica para navegar ou abrir o formulário de edição
};

const handleDelete = (id: string) => {
  if (window.confirm('Tem certeza que deseja excluir esta terapia?')) {
    console.log(`Excluir terapia: ${id}`);
    // Lógica para chamar a API de exclusão e atualizar o estado
  }
};

// --- Componente principal ---
const AgendaDeTerapias = () => {
  // Agrupar terapias por dia para corresponder ao layout
  const terapiasPorDia = terapias.reduce((acc: Record<string, Terapia[]>, terapia) => {
    acc[terapia.dia] = acc[terapia.dia] || [];
    acc[terapia.dia].push(terapia);
    return acc;
  }, {});

  return (
    <div className="agenda-container p-4">
      <div className="header flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Agenda de Terapias</h2>
        <button className="btn-primario bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => console.log('Adicionar Terapia')}>
          + Terapia
        </button>
      </div>

      {Object.entries(terapiasPorDia).map(([dia, listaTerapias]) => (
        <div key={dia} className="cartao-dia bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
          <div className="cabecalho-dia flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-700">{dia}</h3>
            {listaTerapias[0].isHoje && <span className="tag-hoje bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">HOJE</span>}
          </div>

          {listaTerapias.map((terapia) => (
            <div key={terapia.id} className="item-terapia flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              {/* Informações da Terapia */}
              <div className="info-terapia">
                <div className="horario-principal text-sm text-slate-500 font-medium flex items-center gap-1">
                  <span role="img" aria-label="relógio">🕒</span> {terapia.horario}
                </div>
                <div className="nome-terapia text-base font-bold text-slate-800">
                  <strong>{terapia.nome}</strong>
                </div>
                <div className="alarme text-xs text-red-500 font-medium flex items-center gap-1">
                  <span role="img" aria-label="alarme">🚨</span> Alarme: {terapia.alarme}
                </div>
              </div>

              {/* Opções de Ação (Edição e Exclusão) */}
              <div className="acoes-terapia flex gap-2">
                {/* Ícone de Edição */}
                <button
                  className="btn-icone editar p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  onClick={() => handleEdit(terapia.id)}
                  title="Editar Terapia"
                >
                  <span role="img" aria-label="lápis">✏️</span>
                </button>

                {/* Ícone de Exclusão */}
                <button
                  className="btn-icone excluir p-2 text-slate-400 hover:text-red-600 transition-colors"
                  onClick={() => handleDelete(terapia.id)}
                  title="Excluir Terapia"
                >
                  <span role="img" aria-label="lixeira">🗑️</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AgendaDeTerapias;