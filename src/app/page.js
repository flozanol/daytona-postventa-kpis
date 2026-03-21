'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, Activity } from 'lucide-react';

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [mesBase, setMesBase] = useState('');
  const [mesComparacion, setMesComparacion] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [kpiRanking, setKpiRanking] = useState('Venta Total');

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwcS4mh6qN2rqhcrnuBEssd5GIsEiXAp242OuqK9tuxEZfR_xRRJszCRbiDTUJIzbOwpkJpa4kqI4_/pub?gid=1096001978&single=true&output=csv';

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanData = results.data.filter(d => d && d.Agencia && d.Mes && d.KPI);
        setData(cleanData);
        if (cleanData.length > 0) {
          const mesesDisp = [...new Set(cleanData.map(d => d.Mes))];
          const catDisp = [...new Set(cleanData.map(d => d.Tipo))];

          setMesBase(mesesDisp[mesesDisp.length - 1]);
          setMesComparacion(mesesDisp.length > 1 ? mesesDisp[mesesDisp.length - 2] : mesesDisp[mesesDisp.length - 1]);
          setSelectedCategory(catDisp[0]);
        }
        setLoading(false);
      }
    });
  }, []);

  const getVal = (m, c, a, k) => {
    if (!m || !c || !k) return 0;
    let f = data.filter(d => String(d.Mes) === String(m) && d.Tipo === c && d.KPI === k);
    if (a !== 'Todas') f = f.filter(d => d.Agencia === a);
    return f.reduce((sum, item) => sum + (Number(item.Valor) || 0), 0);
  };

  const calcDelta = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  };

  // --- AQUÍ ESTÁ LA MAGIA CORREGIDA ---
  const formatMoney = (val, kpiName) => {
    const nameLower = String(kpiName).toLowerCase();

    // 1. Si es porcentaje explícito
    if (nameLower.includes('%')) return val.toFixed(1) + '%';

    // 2. Palabras clave que NO son dinero
    const keywordsGeneral = [
      'ordenes', 'órdenes', 'unidades', 'facturadas',
      'permanencia', 'retención', 'retencion'
    ];

    const isGeneralNumber = keywordsGeneral.some(kw => nameLower.includes(kw));

    if (isGeneralNumber) {
      // Si tiene decimales (como Permanencia Promedio), le dejamos 1 decimal, si es entero, lo dejamos cerrado
      return Number.isInteger(val) ? val.toLocaleString('es-MX') : val.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    // 3. Todo lo demás es Dinero
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  // -------------------------------------

  const DeltaBadge = ({ value }) => {
    if (value > 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold"><TrendingUp size={12} /> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold"><TrendingDown size={12} /> {value.toFixed(1)}%</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold"><Minus size={12} /> 0%</span>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-[#003366] font-bold text-xl">Cargando Daytona Postventa...</div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">

      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-3xl font-black text-[#003366] tracking-tight">DAYTONA</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Dashboard Postventa</p>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><Calendar size={14} /> 1. Mes Actual</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none"
              value={mesBase} onChange={e => setMesBase(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><Calendar size={14} /> 2. Mes a Comparar</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none"
              value={mesComparacion} onChange={e => setMesComparacion(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><MapPin size={14} /> 3. Agencia</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none"
              value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)}>
              <option value="Todas">Consolidado (Todas)</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 p-6 md:p-10">

        {/* TABS DE CATEGORÍA */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          {categorias.map(c => (
            <button
              key={c} onClick={() => setSelectedCategory(c)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap
                ${selectedCategory === c ? 'bg-[#003366] text-white shadow' : 'bg-white text-gray-500 hover:text-[#003366] border border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-8">

          {/* TABLA 1: COMPARATIVA TEMPORAL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2"><Activity size={18} /> Análisis Detallado: {selectedAgencia}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Indicador (KPI)</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Actual ({mesBase})</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Comparativa ({mesComparacion})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todosLosKPIs.map(kpi => {
                    const valAct = getVal(mesBase, selectedCategory, selectedAgencia, kpi);
                    const valComp = getVal(mesComparacion, selectedCategory, selectedAgencia, kpi);
                    if (valAct === 0 && valComp === 0) return null;

                    return (
                      <tr key={kpi} className="hover:bg-blue-50/50">
                        <td className="p-4 font-bold text-gray-700">{kpi}</td>
                        <td className="p-4 text-right font-black text-[#003366] text-lg">{formatMoney(valAct, kpi)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-medium text-gray-500">{formatMoney(valComp, kpi)}</span>
                            <DeltaBadge value={calcDelta(valAct, valComp)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: RANKING AGENCIAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-lg font-bold text-[#003366]">Ranking Comparativo entre Agencias</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Analizar:</span>
                <select className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none"
                  value={kpiRanking} onChange={e => setKpiRanking(e.target.value)}>
                  {todosLosKPIs.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Agencia</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Resultado ({mesBase})</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Participación (Share)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agencias.map(ag => {
                    const valAg = getVal(mesBase, selectedCategory, ag, kpiRanking);
                    const valTot = getVal(mesBase, selectedCategory, 'Todas', kpiRanking);
                    const share = valTot > 0 ? (valAg / valTot) * 100 : 0;
                    if (valAg === 0) return null;

                    return (
                      <tr key={ag} className="hover:bg-blue-50/50">
                        <td className="p-4 font-bold text-gray-700">{ag}</td>
                        <td className="p-4 text-right font-black text-gray-800 text-lg">{formatMoney(valAg, kpiRanking)}</td>
                        <td className="p-4 text-right">
                          <span className="bg-blue-100 text-[#003366] font-bold px-3 py-1 rounded text-sm">{share.toFixed(1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}