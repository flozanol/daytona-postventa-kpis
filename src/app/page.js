'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Card, Title, Text, Metric, Grid, Table, TableHead, TableRow,
  TableHeaderCell, TableBody, TableCell, BadgeDelta, TabGroup,
  TabList, Tab, Select, SelectItem, Flex
} from "@tremor/react";

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsj, setErrorMsj] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState('Feb-26');
  const [selectedCategory, setSelectedCategory] = useState('Normal');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedKPI, setSelectedKPI] = useState('Venta Total');

  // EL LINK EXACTO DEL CSV (Asegúrate de que termina en output=csv)
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwcS4mh6qN2rqhcrnuBEssd5GIsEiXAp242OuqK9tuxEZfR_xRRJszCRbiDTUJIzbOwpkJpa4kqI4_/pub?gid=1096001978&single=true&output=csv';

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0 && results.data[0].Agencia) {
          setData(results.data.filter(d => d.Agencia && d.Mes && d.KPI));
          setLoading(false);
        } else {
          setErrorMsj("El archivo no parece ser un CSV válido. Revisa el link de Google Sheets.");
          setLoading(false);
        }
      },
      error: () => {
        setErrorMsj("No se pudo conectar con Google Sheets.");
        setLoading(false);
      }
    });
  }, []);

  // Funciones de tiempo (Calculan mes anterior y año anterior automáticamente)
  const mesesOrden = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getPeriodos = (mesActual) => {
    if (!mesActual || !mesActual.includes('-')) return { prevMes: null, prevAño: null };
    const [mesStr, añoStr] = mesActual.split('-');
    const año = parseInt(añoStr);
    const mesIndex = mesesOrden.indexOf(mesStr);

    let prevMesStr = mesIndex === 0 ? 'Dic' : mesesOrden[mesIndex - 1];
    let prevMesAño = mesIndex === 0 ? año - 1 : año;

    return {
      prevMes: `${prevMesStr}-${prevMesAño}`,
      prevAño: `${mesStr}-${año - 1}`
    };
  };

  const getVal = (m, c, a, k) => {
    let f = data.filter(d => d.Mes === m && d.Tipo === c && d.KPI === k);
    if (a !== 'Todas') f = f.filter(d => d.Agencia === a);
    return f.reduce((sum, item) => sum + (Number(item.Valor) || 0), 0);
  };

  const calcVariacion = (actual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return ((actual - anterior) / anterior) * 100;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-[#003366]">Cargando Dashboard Daytona...</div>;
  if (errorMsj) return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">{errorMsj}</div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = [...new Set(data.map(d => d.Tipo))];
  const todosLosKPIs = [...new Set(data.map(d => d.KPI))];

  const { prevMes, prevAño } = getPeriodos(selectedMonth);

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 font-sans">
      {/* HEADER TIPO "NUEVOS" */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <Title className="text-3xl font-bold text-[#003366]">Postventa KPIs</Title>
          <Text>Grupo Daytona</Text>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} placeholder="Mes Actual">
            {meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </Select>
          <Select value={selectedAgencia} onValueChange={setSelectedAgencia} placeholder="Agencia">
            <SelectItem value="Todas">Todas las Agencias</SelectItem>
            {agencias.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* TABS DE CATEGORÍAS */}
      <TabGroup index={categorias.indexOf(selectedCategory)} onIndexChange={i => setSelectedCategory(categorias[i])} className="mb-6">
        <TabList variant="solid" className="bg-white rounded-md p-1 shadow-sm">
          {categorias.map(c => <Tab key={c} className="ui-selected:bg-[#003366] ui-selected:text-white">{c}</Tab>)}
        </TabList>
      </TabGroup>

      {/* TABLA: TODOS LOS KPIS (Misma Agencia / Mismo Mes vs Ant / vs Año) */}
      <Card className="mb-6 shadow-sm border-0">
        <Title className="text-[#003366] mb-4">Resumen de KPIs: {selectedAgencia} ({selectedCategory})</Title>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>KPI</TableHeaderCell>
              <TableHeaderCell textAlignment="right">{selectedMonth} (Actual)</TableHeaderCell>
              <TableHeaderCell textAlignment="right">{prevMes} (Mes Ant.)</TableHeaderCell>
              <TableHeaderCell textAlignment="right">Var % Mes</TableHeaderCell>
              <TableHeaderCell textAlignment="right">{prevAño} (Año Ant.)</TableHeaderCell>
              <TableHeaderCell textAlignment="right">Var % Año</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {todosLosKPIs.map(kpi => {
              const valActual = getVal(selectedMonth, selectedCategory, selectedAgencia, kpi);
              const valMesAnt = getVal(prevMes, selectedCategory, selectedAgencia, kpi);
              const valAñoAnt = getVal(prevAño, selectedCategory, selectedAgencia, kpi);
              const varMes = calcVariacion(valActual, valMesAnt);
              const varAño = calcVariacion(valActual, valAñoAnt);

              return (
                <TableRow key={kpi}>
                  <TableCell className="font-medium text-gray-700">{kpi}</TableCell>
                  <TableCell textAlignment="right" className="font-bold">${valActual.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">${valMesAnt.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">
                    <BadgeDelta deltaType={varMes >= 0 ? "moderateIncrease" : "moderateDecrease"}>{varMes.toFixed(1)}%</BadgeDelta>
                  </TableCell>
                  <TableCell textAlignment="right">${valAñoAnt.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">
                    <BadgeDelta deltaType={varAño >= 0 ? "moderateIncrease" : "moderateDecrease"}>{varAño.toFixed(1)}%</BadgeDelta>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* TABLA: COMPARATIVA ENTRE AGENCIAS */}
      <Card className="shadow-sm border-0">
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title className="text-[#003366]">Comparativa de Agencias</Title>
          <Select value={selectedKPI} onValueChange={setSelectedKPI} className="max-w-xs">
            {todosLosKPIs.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </Select>
        </Flex>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Agencia</TableHeaderCell>
              <TableHeaderCell textAlignment="right">{selectedKPI} ({selectedMonth})</TableHeaderCell>
              <TableHeaderCell textAlignment="right">Participación %</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agencias.map(ag => {
              const valAgencia = getVal(selectedMonth, selectedCategory, ag, selectedKPI);
              const valTotal = getVal(selectedMonth, selectedCategory, 'Todas', selectedKPI);
              const participacion = valTotal > 0 ? (valAgencia / valTotal) * 100 : 0;

              return (
                <TableRow key={ag}>
                  <TableCell>{ag}</TableCell>
                  <TableCell textAlignment="right" className="font-bold text-[#003366]">${valAgencia.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">{participacion.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}