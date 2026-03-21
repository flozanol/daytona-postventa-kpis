'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Card, Title, Text, Table, TableHead, TableRow,
  TableHeaderCell, TableBody, TableCell, BadgeDelta,
  TabGroup, TabList, Tab, Select, SelectItem
} from "@tremor/react";

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados iniciales seguros
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('');

  // TU LINK CSV CONFIRMADO
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

        // Autoseleccionar el primer mes y categoría que encuentre para que no explote
        if (cleanData.length > 0) {
          const mesesDisponibles = [...new Set(cleanData.map(d => d.Mes))];
          const categoriasDisponibles = [...new Set(cleanData.map(d => d.Tipo))];
          setSelectedMonth(mesesDisponibles[mesesDisponibles.length - 1]); // Selecciona el último
          setSelectedCategory(categoriasDisponibles[0]);
        }
        setLoading(false);
      }
    });
  }, []);

  // Lógica de fechas (de Ene-26 saca Dic-25 y Ene-25)
  const getPeriodos = (mesActual) => {
    if (!mesActual || !mesActual.includes('-')) return { prevMes: 'N/A', prevAño: 'N/A' };
    const mesesArray = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const [mesStr, añoStr] = mesActual.split('-');
    const año = parseInt(añoStr);
    const mesIndex = mesesArray.indexOf(mesStr);

    let prevMesStr = mesIndex === 0 ? 'Dic' : mesesArray[mesIndex - 1];
    let prevMesAño = mesIndex === 0 ? año - 1 : año;

    return {
      prevMes: `${prevMesStr}-${prevMesAño}`,
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

  // Pantalla de carga bonita, no un error feo
  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-gray-50"><h1 className="text-2xl font-bold text-[#003366]">Cargando KPIs Daytona...</h1></div>;
  if (data.length === 0) return <div className="flex h-screen w-full items-center justify-center"><h1 className="text-xl text-red-600">Error: El Google Sheet está vacío o el link es incorrecto.</h1></div>;

  // Listas únicas para los filtros
  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];

  const { prevMes, prevAño } = getPeriodos(selectedMonth);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">

      {/* SIDEBAR (Barra lateral izquierda igual a Nuevos) */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 p-6 shadow-md flex flex-col z-10">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Daytona</h1>
          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Dashboard Postventa</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Mes de Análisis</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              {meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Agencia a Comparar</label>
            <Select value={selectedAgencia} onValueChange={setSelectedAgencia}>
              <SelectItem value="Todas">Consolidado (Todas)</SelectItem>
              {agencias.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </Select>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DERECHA */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* TABS DE CATEGORÍA */}
        <div className="mb-6">
          <TabGroup
            index={categorias.indexOf(selectedCategory) !== -1 ? categorias.indexOf(selectedCategory) : 0}
            onIndexChange={i => setSelectedCategory(categorias[i])}
          >
            <TabList variant="solid" className="bg-white shadow-sm rounded-lg p-1">
              {categorias.map(c => (
                <Tab key={c} className="ui-selected:bg-[#003366] ui-selected:text-white font-medium px-4 py-2 rounded-md transition-all">
                  {c}
                </Tab>
              ))}
            </TabList>
          </TabGroup>
        </div>

        <div className="flex flex-col gap-8">

          {/* TABLA: TODOS LOS KPIS vs MES ANTERIOR vs AÑO ANTERIOR */}
          <Card className="shadow-lg border-t-4 border-t-[#003366] ring-0">
            <Title className="text-[#003366] text-xl font-bold">
              Desempeño: {selectedAgencia}
            </Title>
            <Text className="mb-6 text-gray-500">
              Mes actual ({selectedMonth}) vs Mes anterior ({prevMes}) vs Año anterior ({prevAño})
            </Text>

            <Table>
              <TableHead className="bg-gray-50/50">
                <TableRow>
                  <TableHeaderCell className="font-bold text-gray-700">Indicador (KPI)</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">Mes Actual</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">vs Mes Ant.</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">vs Año Ant.</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todosLosKPIs.map(kpi => {
                  const valAct = getVal(selectedMonth, selectedCategory, selectedAgencia, kpi);
                  const valMes = getVal(prevMes, selectedCategory, selectedAgencia, kpi);
                  const valAño = getVal(prevAño, selectedCategory, selectedAgencia, kpi);

                  const delMes = calcDelta(valAct, valMes);
                  const delAño = calcDelta(valAct, valAño);

                  if (valAct === 0 && valMes === 0 && valAño === 0) return null;

                  return (
                    <TableRow key={kpi} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-800">{kpi}</TableCell>
                      <TableCell textAlignment="right" className="font-bold text-[#003366] text-lg">
                        {kpi.includes('%') ? valAct.toFixed(1) + '%' : '$' + valAct.toLocaleString('es-MX')}
                      </TableCell>
                      <TableCell textAlignment="right">
                        <div className="flex justify-end items-center gap-2">
                          <Text className="text-gray-500">{kpi.includes('%') ? valMes.toFixed(1) + '%' : '$' + valMes.toLocaleString('es-MX')}</Text>
                          <BadgeDelta deltaType={delMes >= 0 ? "moderateIncrease" : "moderateDecrease"}>{delMes.toFixed(1)}%</BadgeDelta>
                        </div>
                      </TableCell>
                      <TableCell textAlignment="right">
                        <div className="flex justify-end items-center gap-2">
                          <Text className="text-gray-500">{kpi.includes('%') ? valAño.toFixed(1) + '%' : '$' + valAño.toLocaleString('es-MX')}</Text>
                          <BadgeDelta deltaType={delAño >= 0 ? "moderateIncrease" : "moderateDecrease"}>{delAño.toFixed(1)}%</BadgeDelta>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* TABLA: COMPARATIVA TODAS LAS AGENCIAS (RANKING) */}
          <Card className="shadow-lg border-t-4 border-t-gray-400 ring-0">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <div>
                <Title className="text-[#003366] text-xl font-bold">Comparativa de Agencias</Title>
                <Text className="text-gray-500">Participación en {selectedCategory} durante {selectedMonth}</Text>
              </div>
            </div>

            <Table>
              <TableHead className="bg-gray-50/50">
                <TableRow>
                  <TableHeaderCell className="font-bold text-gray-700">Agencia</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">Venta Total</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">Órdenes</TableHeaderCell>
                  <TableHeaderCell textAlignment="right" className="font-bold text-gray-700">Utilidad Bruta</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agencias.map(ag => {
                  const venta = getVal(selectedMonth, selectedCategory, ag, 'Venta Total');
                  const ordenes = getVal(selectedMonth, selectedCategory, ag, 'Órdenes');
                  const utilidad = getVal(selectedMonth, selectedCategory, ag, 'Utilidad Bruta');

                  if (venta === 0 && ordenes === 0) return null;

                  return (
                    <TableRow key={ag} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-bold text-gray-800">{ag}</TableCell>
                      <TableCell textAlignment="right" className="text-green-700 font-medium">
                        ${venta.toLocaleString('es-MX')}
                      </TableCell>
                      <TableCell textAlignment="right" className="text-gray-600 font-medium">
                        {ordenes.toLocaleString('es-MX')}
                      </TableCell>
                      <TableCell textAlignment="right" className="text-blue-700 font-medium">
                        ${utilidad.toLocaleString('es-MX')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

        </div>
      </div>
    </div>
  );
}