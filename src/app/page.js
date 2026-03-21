'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, Activity } from 'lucide-react';

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedKPIComparativo, setSelectedKPIComparativo] = useState('Venta Total');

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
          setSelectedMonth(mesesDisp[mesesDisp.length - 1]);
          setSelectedCategory(catDisp[0]);
        }
        setLoading(false);
      }
    });
  }, []);

  const getPeriodos = (mesActual) => {
    if (!mesActual || !mesActual.includes('-')) return { prevMes: 'N/A', prevAño: 'N/A' };
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [mesStr, añoStr] = mesActual.split('-');
    const año = parseInt(añoStr);
    const mIndex = meses.indexOf(mesStr);

    let pMes = mIndex === 0 ? 'Dic' : meses[mIndex - 1];
    let pMesAño = mIndex === 0 ? año - 1 : año;

    return {
      prevMes: `${pMes}-${pMesAño}`,
      prevAño: `${mesStr}-${año - 1}`
    };
  };

  const getVal = (m, c, a, k) => {
    if (!m || !c || !k) return 0;
    let f = data.filter(d => d.Mes === m && d.Tipo === c && d.KPI === k);
    if (a !== 'Todas') f = f.filter(d => d.Agencia === a);
    return f.reduce((sum, item) => sum + (Number(item.Valor) || 0), 0);
  };

  const calcDelta = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const formatMoney = (val, kpiName) => {
    if (kpiName.includes('%')) return val.toFixed(1) + '%';
    if (kpiName.includes('Órdenes') || kpiName.includes('Unidades')) return val.toLocaleString('es-MX');
    return '$' + val.toLocaleString('es-MX');
  };

  const DeltaBadge = ({ value }) => {
    if (value > 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-bold"><TrendingUp size={14} /> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-bold"><TrendingDown size={14} /> {value.toFixed(1)}%</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold"><Minus size={14} /> 0%</span>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F3F4F6]"><div className="text-2xl font-bold text-[#003366] animate-pulse">Cargando KPIs Daytona...</div></div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];
  const { prevMes, prevAño } = getPeriodos(selectedMonth);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* SIDEBAR (Barra Izquierda) */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-3xl font-black text-[#003366] tracking-tight">DAYTONA</h1>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Postventa</p>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase mb-2"><Calendar size={16} /> 1. Mes Actual</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] outline-none cursor-pointer"
              value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase mb-2"><MapPin size={16} /> 2. Agencia a Analizar</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] outline-none cursor-pointer"
              value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)}>
              <option value="Todas">Consolidado (Todas)</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* TABS (Categorías) */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap shadow-sm
                ${selectedCategory === c ? 'bg-[#003366] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-8">

          {/* TABLA 1: MISMA AGENCIA / COMPARATIVA TIEMPO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-[#003366] flex items-center gap-2">
                <Activity size={20} /> Desempeño: {selectedAgencia}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Comparando el mes actual contra el mes anterior y el mismo mes del año pasado.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b">Indicador (KPI)</th>
                    <th className="p-4 font-bold border-b text-right">Actual ({selectedMonth})</th>
                    <th className="p-4 font-bold border-b text-right">vs Mes Ant. ({prevMes})</th>
                    <th className="p-4 font-bold border-b text-right">vs Año Ant. ({prevAño})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todosLosKPIs.map(kpi => {
                    const valAct = getVal(selectedMonth, selectedCategory, selectedAgencia, kpi);
                    const valMes = getVal(prevMes, selectedCategory, selectedAgencia, kpi);
                    const valAño = getVal(prevAño, selectedCategory, selectedAgencia, kpi);

                    if (valAct === 0 && valMes === 0 && valAño === 0) return null;

                    return (
                      <tr key={kpi} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-semibold text-gray-800">{kpi}</td>
                        <td className="p-4 text-right font-bold text-[#003366] text-lg">{formatMoney(valAct, kpi)}</td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-gray-500">{formatMoney(valMes, kpi)}</span>
                            <DeltaBadge value={calcDelta(valAct, valMes)} />
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-gray-500">{formatMoney(valAño, kpi)}</span>
                            <DeltaBadge value={calcDelta(valAct, valAño)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: COMPARATIVA ENTRE AGENCIAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#003366]">Ranking de Agencias</h2>
                <p className="text-sm text-gray-500 mt-1">Comparativa de todas las agencias en el mismo mes.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700">Analizar KPI:</label>
                <select
                  className="p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-[#003366] outline-none cursor-pointer"
                  value={selectedKPIComparativo}
                  onChange={e => setSelectedKPIComparativo(e.target.value)}
                >
                  {todosLosKPIs.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#003366] text-white text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-[#002244]">Agencia</th>
                    <th className="p-4 font-bold border-b border-[#002244] text-right">Resultado ({selectedMonth})</th>
                    <th className="p-4 font-bold border-b border-[#002244] text-right">Participación en Grupo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agencias.map(ag => {
                    const valAgencia = getVal(selectedMonth, selectedCategory, ag, selectedKPIComparativo);
                    const valTotal = getVal(selectedMonth, selectedCategory, 'Todas', selectedKPIComparativo);
                    const share = valTotal > 0 ? (valAgencia / valTotal) * 100 : 0;

                    if (valAgencia === 0) return null;

                    return (
                      <tr key={ag} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{ag}</td>
                        <td className="p-4 text-right font-bold text-gray-900 text-lg">
                          {formatMoney(valAgencia, selectedKPIComparativo)}
                        </td>
                        <td className="p-4 text-right">
                          <span className="inline-block bg-blue-100 text-[#003366] font-bold px-3 py-1 rounded-full text-sm">
                            {share.toFixed(1)}%
                          </span>
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