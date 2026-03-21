'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, Activity, Users, History, LineChart } from 'lucide-react';

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros Globales
  const [mesBase, setMesBase] = useState('');
  const [mesComparacion, setMesComparacion] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Filtros Tablas Inferiores
  const [compAg1, setCompAg1] = useState('');
  const [compAg2, setCompAg2] = useState('');
  const [compAg3, setCompAg3] = useState('Ninguna');
  const [kpiGrafica, setKpiGrafica] = useState('Venta Total');

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwcS4mh6qN2rqhcrnuBEssd5GIsEiXAp242OuqK9tuxEZfR_xRRJszCRbiDTUJIzbOwpkJpa4kqI4_/pub?gid=1096001978&single=true&output=csv';

  const mesesOrdenMap = { Ene: '01', Feb: '02', Mar: '03', Abr: '04', May: '05', Jun: '06', Jul: '07', Ago: '08', Sep: '09', Oct: '10', Nov: '11', Dic: '12' };

  const parseMesToSortable = (mesStr) => {
    if (!mesStr || !mesStr.includes('-')) return '9999-99';
    const [mmm, yy] = mesStr.split('-');
    return `20${yy}-${mesesOrdenMap[mmm]}`;
  };

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
          const agenciasDisp = [...new Set(cleanData.map(d => d.Agencia))].sort();

          const mesesConDatos = mesesDisp.filter(m => cleanData.some(d => d.Mes === m && Number(d.Valor) > 0));
          const sortedMesesReales = mesesConDatos.sort((a, b) => parseMesToSortable(a).localeCompare(parseMesToSortable(b)));

          const mesActual = sortedMesesReales.length > 0 ? sortedMesesReales[sortedMesesReales.length - 1] : mesesDisp[0];
          const mesAnt = sortedMesesReales.length > 1 ? sortedMesesReales[sortedMesesReales.length - 2] : mesActual;

          setMesBase(mesActual);
          setMesComparacion(mesAnt);
          setSelectedCategory(catDisp[0]);

          if (agenciasDisp.length > 0) {
            setCompAg1(agenciasDisp[0]);
            setCompAg2(agenciasDisp[1] || agenciasDisp[0]);
          }
        }
        setLoading(false);
      }
    });
  }, []);

  const getVal = (m, c, a, k) => {
    if (!m || !c || !k || a === 'Ninguna') return 0;
    let f = data.filter(d => String(d.Mes) === String(m) && d.Tipo === c && d.KPI === k);
    if (a !== 'Todas') f = f.filter(d => d.Agencia === a);
    return f.reduce((sum, item) => sum + (Number(item.Valor) || 0), 0);
  };

  const calcDelta = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const formatMoney = (val, kpiName) => {
    if (val === 0 || val === null) return '-';
    const nameLower = String(kpiName).toLowerCase();
    if (nameLower.includes('%')) return val.toFixed(1) + '%';

    const keywordsGeneral = ['ordenes', 'órdenes', 'unidades', 'facturadas', 'permanencia', 'retención', 'retencion'];
    const isGeneralNumber = keywordsGeneral.some(kw => nameLower.includes(kw));

    if (isGeneralNumber) {
      return Number.isInteger(val) ? val.toLocaleString('es-MX') : val.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const DeltaBadge = ({ value }) => {
    if (value > 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold"><TrendingUp size={12} /> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold"><TrendingDown size={12} /> {value.toFixed(1)}%</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold"><Minus size={12} /> 0%</span>;
  };

  if (loading) return <div className="flex h-screen flex-col items-center justify-center bg-[#003366]"><img src="https://grupodaytona.com/_next/image?url=https%3A%2F%2Fapi.grupodaytona.com%2Ffiles%2Fimages%2Ffull-xzLxpZqXUE-1728519042236.png&w=384&q=75" alt="Daytona" className="w-48 mb-6 animate-pulse" /><div className="text-white/70 font-bold text-sm tracking-widest">CARGANDO...</div></div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const mesesConDatosGlobal = [...new Set(data.filter(d => Number(d.Valor) > 0).map(d => d.Mes))];
  const mesesSelectores = mesesConDatosGlobal.sort((a, b) => parseMesToSortable(b).localeCompare(parseMesToSortable(a)));

  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];

  const getMesesHistoricosArr = () => {
    const sortedAll = mesesConDatosGlobal.sort((a, b) => parseMesToSortable(a).localeCompare(parseMesToSortable(b)));
    const sortableSelected = parseMesToSortable(mesBase);
    return sortedAll.filter(m => parseMesToSortable(m) <= sortableSelected);
  };

  const mesesHistoricosArr = getMesesHistoricosArr();
  const agenciaHistoricaNombre = selectedAgencia === 'Todas' ? 'Consolidado Grupo' : selectedAgencia;

  const chartData = mesesHistoricosArr.map(m => ({
    mes: m,
    valor: getVal(m, selectedCategory, selectedAgencia, kpiGrafica)
  }));

  // --- MATEMÁTICAS DE LA GRÁFICA Y TENDENCIA ---
  const n = chartData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  chartData.forEach((d, i) => {
    sumX += i;
    sumY += d.valor;
    sumXY += i * d.valor;
    sumXX += i * i;
  });
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

  const rawMax = Math.max(...chartData.map(d => d.valor));
  const rawMin = Math.min(...chartData.map(d => d.valor));
  const range = rawMax - rawMin === 0 ? 1 : rawMax - rawMin;

  // Padding para que los puntos no peguen en el techo ni en el suelo del cuadro
  const maxValChart = rawMax + (range * 0.15);
  const minValChart = Math.max(0, rawMin - (range * 0.1));
  const paddedRange = maxValChart - minValChart === 0 ? 1 : maxValChart - minValChart;

  const getPercY = (val) => 100 - (((val - minValChart) / paddedRange) * 100);

  const pts = chartData.map((d, i) => ({
    x: n > 1 ? (i / (n - 1)) * 100 : 50,
    y: getPercY(d.valor)
  }));

  const yTrendStart = getPercY(intercept);
  const yTrendEnd = getPercY(slope * (n - 1) + intercept);
  // ----------------------------------------------

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-[#F1F5F9] font-sans text-gray-800 antialiased">

      {/* SIDEBAR */}
      <div className="w-full xl:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col z-10 shrink-0">
        <div className="p-8 border-b border-[#002244] flex flex-col items-center justify-center bg-[#003366] shadow-inner">
          <img src="https://grupodaytona.com/_next/image?url=https%3A%2F%2Fapi.grupodaytona.com%2Ffiles%2Fimages%2Ffull-xzLxpZqXUE-1728519042236.png&w=384&q=75" alt="Grupo Daytona" className="w-40 mb-2" />
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Business Intelligence</p>
        </div>

        <div className="p-6 flex-1 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><Calendar size={14} className="text-[#003366]" /> 1. Mes de Análisis</label>
            <select className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003366] shadow-sm outline-none hover:border-[#003366] transition-colors cursor-pointer"
              value={mesBase} onChange={e => setMesBase(e.target.value)}>
              {mesesSelectores.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><Calendar size={14} className="text-gray-400" /> 2. Comparar Contra</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 outline-none cursor-pointer"
              value={mesComparacion} onChange={e => setMesComparacion(e.target.value)}>
              {mesesSelectores.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><MapPin size={14} className="text-[#003366]" /> 3. Agencia Principal</label>
            <select className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003366] shadow-sm outline-none hover:border-[#003366] transition-colors cursor-pointer"
              value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)}>
              <option value="Todas">Consolidado (Todas)</option>
              {agencias.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 p-4 sm:p-8 xl:p-12 overflow-y-auto w-full">

        {/* CABECERA Y TABS */}
        <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#003366] mb-2 tracking-tight">Desempeño de Postventa</h1>
            <p className="text-sm text-gray-500 font-medium">Análisis detallado de KPIs para Grupo Daytona.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
            {categorias.map(c => (
              <button
                key={c} onClick={() => setSelectedCategory(c)}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap shadow-sm
                  ${selectedCategory === c ? 'bg-[#003366] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10 pb-12">

          {/* TABLA 1: ANÁLISIS TEMPORAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-black text-[#003366] flex items-center gap-2"><Activity size={20} /> Histórico: {selectedAgencia}</h2>
              <p className="text-sm text-gray-500 mt-1">Comparando {mesBase} vs {mesComparacion} en {selectedCategory}.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold border-b border-gray-200">Indicador (KPI)</th>
                    <th className="p-5 font-bold border-b border-gray-200 text-right">Actual ({mesBase})</th>
                    <th className="p-5 font-bold border-b border-gray-200 text-right">Referencia ({mesComparacion})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todosLosKPIs.map(kpi => {
                    const valAct = getVal(mesBase, selectedCategory, selectedAgencia, kpi);
                    const valComp = getVal(mesComparacion, selectedCategory, selectedAgencia, kpi);
                    if (valAct === 0 && valComp === 0) return null;

                    return (
                      <tr key={kpi} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-5 font-bold text-gray-700">{kpi}</td>
                        <td className="p-5 text-right font-black text-[#003366] text-lg">{formatMoney(valAct, kpi)}</td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-semibold text-gray-600">{formatMoney(valComp, kpi)}</span>
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

          {/* TABLA 2: FRENTE A FRENTE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white flex flex-col xl:flex-row justify-between xl:items-center gap-6">
              <div>
                <h2 className="text-xl font-black text-[#003366] flex items-center gap-2"><Users size={20} /> Frente a Frente ({mesBase})</h2>
                <p className="text-sm text-gray-500 mt-1">Comparativa directa entre unidades de negocio.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-200 shadow-inner overflow-x-auto w-full xl:w-auto">
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003366] outline-none shadow-sm cursor-pointer" value={compAg1} onChange={e => setCompAg1(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span className="text-gray-400 font-black text-xs uppercase">vs</span>
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003366] outline-none shadow-sm cursor-pointer" value={compAg2} onChange={e => setCompAg2(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span className="text-gray-400 font-black text-xs uppercase">vs</span>
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#003366] outline-none shadow-sm cursor-pointer" value={compAg3} onChange={e => setCompAg3(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold border-b border-gray-200">Indicador (KPI)</th>
                    {compAg1 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#003366]">{compAg1}</th>}
                    {compAg2 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#003366]">{compAg2}</th>}
                    {compAg3 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#003366]">{compAg3}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todosLosKPIs.map(kpi => {
                    const val1 = getVal(mesBase, selectedCategory, compAg1, kpi);
                    const val2 = getVal(mesBase, selectedCategory, compAg2, kpi);
                    const val3 = getVal(mesBase, selectedCategory, compAg3, kpi);

                    if (val1 === 0 && val2 === 0 && val3 === 0) return null;

                    const maxVal = Math.max(val1, val2, val3);

                    return (
                      <tr key={kpi} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-5 font-bold text-gray-700">{kpi}</td>
                        {compAg1 !== 'Ninguna' && <td className={`p-5 text-right font-black text-lg ${val1 === maxVal && val1 > 0 ? 'text-green-600' : 'text-gray-800'}`}>{formatMoney(val1, kpi)}</td>}
                        {compAg2 !== 'Ninguna' && <td className={`p-5 text-right font-black text-lg ${val2 === maxVal && val2 > 0 ? 'text-green-600' : 'text-gray-800'}`}>{formatMoney(val2, kpi)}</td>}
                        {compAg3 !== 'Ninguna' && <td className={`p-5 text-right font-black text-lg ${val3 === maxVal && val3 > 0 ? 'text-green-600' : 'text-gray-800'}`}>{formatMoney(val3, kpi)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NUEVA SECCIÓN: GRÁFICA DE LÍNEAS + TABLA HISTÓRICA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

            <div className="p-6 border-b border-gray-100 bg-white flex flex-col xl:flex-row justify-between xl:items-center gap-6">
              <div>
                <h2 className="text-xl font-black text-[#003366] flex items-center gap-2"><LineChart size={20} /> Tendencia Histórica: {agenciaHistoricaNombre}</h2>
                <p className="text-sm text-gray-500 mt-1">Evolución y proyección lineal desde Enero 2025 hasta {mesBase}.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Graficar KPI:</span>
                <select className="p-2.5 bg-[#F8FAFC] border border-gray-200 rounded-lg text-sm font-bold text-[#003366] outline-none shadow-sm cursor-pointer"
                  value={kpiGrafica} onChange={e => setKpiGrafica(e.target.value)}>
                  {todosLosKPIs.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            {/* LA GRÁFICA DE LÍNEAS CON TENDENCIA (Soluciona el corte) */}
            <div className="p-6 border-b border-gray-100 bg-[#F8FAFC]/50 overflow-x-auto">
              <div className="relative h-72 min-w-[900px] mt-4 mb-2">

                {/* Zona de Dibujo (Top 80%) */}
                <div className="absolute top-0 left-0 w-full h-[80%]">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {/* Línea de Tendencia (Punteada) */}
                    {n > 1 && (
                      <line x1="0" y1={yTrendStart} x2="100" y2={yTrendEnd} stroke="#9CA3AF" strokeWidth="2" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
                    )}
                    {/* Línea Principal */}
                    <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#003366" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>

                  {/* Puntos y Tooltips */}
                  {pts.map((p, i) => (
                    <div key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                      <div className="group relative cursor-pointer">
                        {/* El Punto */}
                        <div className="w-4 h-4 bg-white border-[3px] border-[#003366] rounded-full z-10 shadow-sm transition-transform hover:scale-125"></div>

                        {/* Etiqueta visible */}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#003366] bg-white/80 px-1 rounded whitespace-nowrap pointer-events-none">
                          {formatMoney(chartData[i].valor, kpiGrafica)}
                        </span>

                        {/* Tooltip Oscuro al pasar el mouse */}
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#002244] text-white text-xs font-bold py-1.5 px-3 rounded shadow-lg whitespace-nowrap pointer-events-none transition-opacity z-20">
                          {chartData[i].mes}: {formatMoney(chartData[i].valor, kpiGrafica)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Etiquetas Eje X (Bottom 20%) */}
                <div className="absolute bottom-0 left-0 w-full h-[20%] flex items-end pb-2">
                  {pts.map((p, i) => (
                    <div key={i} className="absolute text-[10px] sm:text-xs font-bold text-gray-500 whitespace-nowrap" style={{ left: `${p.x}%`, transform: 'translateX(-50%)' }}>
                      {chartData[i].mes}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LA TABLA HISTÓRICA */}
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[1500px]">
                <thead>
                  <tr className="bg-[#F8FAFC] text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold border-b border-gray-100 w-64 sticky left-0 bg-[#F8FAFC] z-10 shadow-[2px_0_5px_0_rgba(0,0,0,0.05)]">Indicador (KPI)</th>
                    {mesesHistoricosArr.map(m => (
                      <th key={m} className="p-5 font-bold border-b border-gray-100 text-right w-36">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todosLosKPIs.map(kpi => {
                    const hasDataInHistory = mesesHistoricosArr.some(m => getVal(m, selectedCategory, selectedAgencia, kpi) > 0);
                    if (!hasDataInHistory) return null;

                    return (
                      <tr key={kpi} className="hover:bg-blue-50/40 group transition-colors">
                        <td className="p-5 font-bold text-gray-700 bg-white sticky left-0 z-1 shadow-[2px_0_5px_0_rgba(0,0,0,0.05)] group-hover:bg-[#EBF5FF] transition-colors">{kpi}</td>
                        {mesesHistoricosArr.map(m => {
                          const val = getVal(m, selectedCategory, selectedAgencia, kpi);
                          return (
                            <td key={m} className="p-5 text-right font-medium text-gray-600 group-hover:text-[#003366]">
                              {formatMoney(val, kpi)}
                            </td>
                          );
                        })}
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