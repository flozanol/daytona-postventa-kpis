'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, Activity, Users, Trophy, DollarSign, Target } from 'lucide-react';

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros Globales
  const [mesBase, setMesBase] = useState('');
  const [mesComparacion, setMesComparacion] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Filtros para la Tabla Frente a Frente
  const [compAg1, setCompAg1] = useState('');
  const [compAg2, setCompAg2] = useState('');
  const [compAg3, setCompAg3] = useState('Ninguna'); // Por defecto la tercera está "apagada"

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
          const agenciasDisp = [...new Set(cleanData.map(d => d.Agencia))].sort();

          setMesBase(mesesDisp[mesesDisp.length - 1]);
          setMesComparacion(mesesDisp.length > 1 ? mesesDisp[mesesDisp.length - 2] : mesesDisp[mesesDisp.length - 1]);
          setSelectedCategory(catDisp[0]);

          if (agenciasDisp.length > 0) {
            setCompAg1(agenciasDisp[0]);
            setCompAg2(agenciasDisp[1] || agenciasDisp[0]);
            // compAg3 se queda como 'Ninguna' por default
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
    if (val === 0) return '-';
    const nameLower = String(kpiName).toLowerCase();
    if (nameLower.includes('%')) return val.toFixed(1) + '%';

    const keywordsGeneral = ['ordenes', 'órdenes', 'unidades', 'facturadas', 'permanencia', 'retención', 'retencion'];
    const isGeneralNumber = keywordsGeneral.some(kw => nameLower.includes(kw));

    if (isGeneralNumber) {
      return Number.isInteger(val) ? val.toLocaleString('es-MX') : val.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Función para encontrar a la mejor agencia en un KPI específico
  const getTopPerformer = (kpi) => {
    let topAgencia = 'N/A';
    let maxVal = -1;

    agencias.forEach(ag => {
      const val = getVal(mesBase, selectedCategory, ag, kpi);
      if (val > maxVal) {
        maxVal = val;
        topAgencia = ag;
      }
    });

    return { agencia: topAgencia, valor: maxVal };
  };

  const DeltaBadge = ({ value }) => {
    if (value > 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold"><TrendingUp size={12} /> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold"><TrendingDown size={12} /> {value.toFixed(1)}%</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold"><Minus size={12} /> 0%</span>;
  };

  if (loading) return <div className="flex h-screen flex-col items-center justify-center bg-white"><img src="https://grupodaytona.com/_next/image?url=https%3A%2F%2Fapi.grupodaytona.com%2Ffiles%2Fimages%2Ffull-xzLxpZqXUE-1728519042236.png&w=384&q=75" alt="Daytona" className="w-48 mb-6 animate-pulse" /><div className="text-gray-500 font-bold text-sm tracking-widest">CARGANDO KPIS...</div></div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];

  // Calculamos los ganadores del mes actual
  const topVentas = getTopPerformer('Venta Total');
  const topRetencion = getTopPerformer('Retención Global');
  const topOrdenes = getTopPerformer('Órdenes');

  return (
    <div className="flex flex-col xl:flex-row min-h-screen bg-[#F4F6F8] font-sans text-gray-800">

      {/* SIDEBAR (Estilo Corporativo Daytona) */}
      <div className="w-full xl:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col z-10 shrink-0">
        <div className="p-8 border-b border-gray-100 flex flex-col items-center justify-center bg-[#F8FAFC]">
          <img src="https://grupodaytona.com/_next/image?url=https%3A%2F%2Fapi.grupodaytona.com%2Ffiles%2Fimages%2Ffull-xzLxpZqXUE-1728519042236.png&w=384&q=75" alt="Grupo Daytona" className="w-40 mb-2" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Business Intelligence</p>
        </div>

        <div className="p-6 flex-1 space-y-8">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><Calendar size={14} className="text-[#0E3A75]" /> 1. Mes de Análisis</label>
            <select className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#0E3A75] shadow-sm outline-none hover:border-[#0E3A75] transition-colors cursor-pointer"
              value={mesBase} onChange={e => setMesBase(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><Calendar size={14} className="text-gray-400" /> 2. Comparar Contra</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 outline-none cursor-pointer"
              value={mesComparacion} onChange={e => setMesComparacion(e.target.value)}>
              {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider"><MapPin size={14} className="text-[#0E3A75]" /> 3. Agencia Principal</label>
            <select className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#0E3A75] shadow-sm outline-none hover:border-[#0E3A75] transition-colors cursor-pointer"
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
        <div className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0E3A75] mb-2 tracking-tight">Desempeño de Postventa</h1>
            <p className="text-sm text-gray-500 font-medium">Análisis detallado de KPIs para la unidad de negocio seleccionada.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
            {categorias.map(c => (
              <button
                key={c} onClick={() => setSelectedCategory(c)}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap
                  ${selectedCategory === c ? 'bg-[#0E3A75] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* TOP PERFORMERS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
            <div className="bg-blue-50 p-3 rounded-xl text-[#0E3A75]"><Trophy size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mayor Venta Total</p>
              <h3 className="text-lg font-black text-gray-800 leading-none truncate w-48">{topVentas.agencia}</h3>
              <p className="text-sm font-bold text-green-600 mt-1">{formatMoney(topVentas.valor, 'Venta Total')}</p>
            </div>
            <div className="absolute -right-4 -top-4 text-blue-50 opacity-50"><DollarSign size={100} /></div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Target size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mejor Retención Global</p>
              <h3 className="text-lg font-black text-gray-800 leading-none truncate w-48">{topRetencion.agencia}</h3>
              <p className="text-sm font-bold text-amber-600 mt-1">{formatMoney(topRetencion.valor, 'Retención Global')}</p>
            </div>
            <div className="absolute -right-4 -top-4 text-amber-50 opacity-50"><Activity size={100} /></div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600"><Users size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mayor Vol. Órdenes</p>
              <h3 className="text-lg font-black text-gray-800 leading-none truncate w-48">{topOrdenes.agencia}</h3>
              <p className="text-sm font-bold text-purple-600 mt-1">{formatMoney(topOrdenes.valor, 'Órdenes')}</p>
            </div>
            <div className="absolute -right-4 -top-4 text-purple-50 opacity-50"><MapPin size={100} /></div>
          </div>
        </div>

        <div className="space-y-10">

          {/* TABLA 1: ANÁLISIS TEMPORAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-black text-[#0E3A75] flex items-center gap-2"><Activity size={20} /> Histórico: {selectedAgencia}</h2>
              <p className="text-sm text-gray-500 mt-1">Comparando resultados de {mesBase} contra {mesComparacion}.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
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
                        <td className="p-5 text-right font-black text-[#0E3A75] text-lg">{formatMoney(valAct, kpi)}</td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-semibold text-gray-500">{formatMoney(valComp, kpi)}</span>
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
                <h2 className="text-xl font-black text-[#0E3A75] flex items-center gap-2"><Users size={20} /> Frente a Frente ({mesBase})</h2>
                <p className="text-sm text-gray-500 mt-1">El valor ganador de cada fila se resalta en verde.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-200">
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#0E3A75] outline-none shadow-sm cursor-pointer" value={compAg1} onChange={e => setCompAg1(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span className="text-gray-400 font-black text-xs uppercase">vs</span>
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#0E3A75] outline-none shadow-sm cursor-pointer" value={compAg2} onChange={e => setCompAg2(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <span className="text-gray-400 font-black text-xs uppercase">vs</span>
                <select className="w-full sm:w-auto p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-[#0E3A75] outline-none shadow-sm cursor-pointer" value={compAg3} onChange={e => setCompAg3(e.target.value)}>
                  <option value="Ninguna">Ninguna</option>
                  <option value="Todas">Consolidado</option>
                  {agencias.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold border-b border-gray-200">Indicador (KPI)</th>
                    {compAg1 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#0E3A75]">{compAg1}</th>}
                    {compAg2 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#0E3A75]">{compAg2}</th>}
                    {compAg3 !== 'Ninguna' && <th className="p-5 font-bold border-b border-gray-200 text-right text-[#0E3A75]">{compAg3}</th>}
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

        </div>
      </div>
    </div>
  );
}