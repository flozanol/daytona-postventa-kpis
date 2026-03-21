'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, DollarSign, Activity, FileText } from 'lucide-react';

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

    return { prevMes: `${pMes}-${pMesAño}`, prevAño: `${mesStr}-${año - 1}` };
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
    if (value > 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><TrendingUp size={12} /> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><TrendingDown size={12} /> {value.toFixed(1)}%</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold"><Minus size={12} /> 0%</span>;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="text-xl font-bold text-[#003366] animate-pulse">Cargando Daytona Postventa...</div></div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];
  const { prevMes, prevAño } = getPeriodos(selectedMonth);

  // KPIs para las tarjetas superiores
  const vTotal = getVal(selectedMonth, selectedCategory, selectedAgencia, 'Venta Total');
  const uBruta = getVal(selectedMonth, selectedCategory, selectedAgencia, 'Utilidad Bruta');
  const ordenes = getVal(selectedMonth, selectedCategory, selectedAgencia, 'Órdenes');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">

      {/* SIDEBAR - Estilo Daytona Nuevos */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-[#003366] tracking-tight">DAYTONA</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Postventa KPIs</p>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><Calendar size={14} /> Mes de Análisis</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#003366] focus:ring-2 focus:ring-[#003366] outline-none transition-all cursor-pointer"
              value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><MapPin size={14} /> Agencia</label>
            <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-[#003366] focus:ring-2 focus:ring-[#003366] outline-none transition-all cursor-pointer"
              value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)}>
              <option value="Todas">Consolidado (Todas)</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* TABS DE CATEGORÍA */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          {categorias.map(c => (
            <button
              key={c} onClick={() => setSelectedCategory(c)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap
                ${selectedCategory === c ? 'bg-[#003366] text-white shadow-md' : 'bg-white text-gray-500 hover:text-[#003366] hover:bg-blue-50 border border-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* TARJETAS DE RESUMEN (KPI CARDS - Como en Nuevos) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#003366]">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><DollarSign size={16} /> <h3 className="text-sm font-bold">Venta Total</h3></div>
            <p className="text-3xl font-black text-gray-800">${vTotal.toLocaleString('es-MX')}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Canal: {selectedCategory}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-400">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><Activity size={16} /> <h3 className="text-sm font-bold">Utilidad Bruta</h3></div>
            <p className="text-3xl font-black text-gray-800">${uBruta.toLocaleString('es-MX')}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Mes: {selectedMonth}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-400">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><FileText size={16} /> <h3 className="text-sm font-bold">Órdenes</h3></div>
            <p className="text-3xl font-black text-gray-800">{ordenes.toLocaleString('es-MX')}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">Agencia: {selectedAgencia}</p>
          </div>
        </div>

        <div className="space-y-8">

          {/* TABLA 1: COMPARATIVA TEMPORAL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white">
              <h2 className="text-lg font-bold text-[#003366]">Análisis Detallado: {selectedAgencia}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Indicador (KPI)</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Actual ({selectedMonth})</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Mes Ant. ({prevMes})</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Año Ant. ({prevAño})</th>
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
                        <td className="p-4 font-semibold text-gray-700">{kpi}</td>
                        <td className="p-4 text-right font-black text-[#003366]">{formatMoney(valAct, kpi)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-medium text-gray-600">{formatMoney(valMes, kpi)}</span>
                            <DeltaBadge value={calcDelta(valAct, valMes)} />
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-medium text-gray-600">{formatMoney(valAño, kpi)}</span>
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

          {/* TABLA 2: RANKING AGENCIAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-lg font-bold text-[#003366]">Ranking Comparativo</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Analizar:</span>
                <select className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none"
                  value={selectedKPIComparativo} onChange={e => setSelectedKPIComparativo(e.target.value)}>
                  {todosLosKPIs.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100">Agencia</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Resultado ({selectedMonth})</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agencias.map(ag => {
                    const valAg = getVal(selectedMonth, selectedCategory, ag, selectedKPIComparativo);
                    const valTot = getVal(selectedMonth, selectedCategory, 'Todas', selectedKPIComparativo);
                    const share = valTot > 0 ? (valAg / valTot) * 100 : 0;
                    if (valAg === 0) return null;

                    return (
                      <tr key={ag} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-bold text-gray-700">{ag}</td>
                        <td className="p-4 text-right font-black text-gray-800">{formatMoney(valAg, selectedKPIComparativo)}</td>
                        <td className="p-4 text-right">
                          <span className="bg-[#003366]/10 text-[#003366] font-black px-3 py-1 rounded-md text-sm">{share.toFixed(1)}%</span>
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