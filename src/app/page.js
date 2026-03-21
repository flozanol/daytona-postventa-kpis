'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Card, Title, Text, Metric, Grid, Table, TableHead, TableRow,
  TableHeaderCell, TableBody, TableCell, BadgeDelta, TabGroup,
  TabList, Tab, Select, SelectItem, Flex, AreaChart
} from "@tremor/react";

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Feb-26');
  const [selectedCategory, setSelectedCategory] = useState('Normal');
  const [selectedAgencia, setSelectedAgencia] = useState('Todas');

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwcS4mh6qN2rqhcrnuBEssd5GIsEiXAp242OuqK9tuxEZfR_xRRJszCRbiDTUJIzbOwpkJpa4kqI4_/pub?gid=1096001978&single=true&output=csv';

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data.filter(d => d.Agencia));
        setLoading(false);
      }
    });
  }, []);

  const getVal = (m, c, a, k) => {
    let f = data.filter(d => d.Mes === m && d.Tipo === c && d.KPI === k);
    if (a !== 'Todas') f = f.filter(d => d.Agencia === a);
    return f.reduce((s, i) => s + (Number(i.Valor) || 0), 0);
  };

  if (loading) return <div className="p-10 font-sans text-center">Cargando Dashboard Daytona...</div>;

  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const meses = [...new Set(data.map(d => d.Mes))].reverse();
  const categorias = ['Normal', 'Garantía', 'H&P', 'Seguros'];
  const prevMonth = "Ene-26"; // Lógica simplificada para probar
  const prevYear = "Feb-25";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
      {/* Header Estilo Profesional */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#003366]">Daytona Postventa</h1>
          <p className="text-gray-500">Panel de Control de KPIs e Indicadores</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            {meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </Select>
          <Select value={selectedAgencia} onValueChange={setSelectedAgencia}>
            <SelectItem value="Todas">Grupales</SelectItem>
            {agencias.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </Select>
        </div>
      </div>

      <TabGroup className="mb-8" index={categorias.indexOf(selectedCategory)} onIndexChange={i => setSelectedCategory(categorias[i])}>
        <TabList variant="solid">
          {categorias.map(c => <Tab key={c}>{c}</Tab>)}
        </TabList>
      </TabGroup>

      {/* KPI Cards */}
      <Grid numItemsMd={3} className="gap-6 mb-8">
        {['Venta Total', 'Utilidad Bruta', 'Ticket Promedio'].map(kpi => {
          const val = getVal(selectedMonth, selectedCategory, selectedAgencia, kpi);
          const old = getVal(prevYear, selectedCategory, selectedAgencia, kpi);
          const delta = old ? ((val - old) / old) * 100 : 0;
          return (
            <Card key={kpi} decoration="top" decorationColor="blue">
              <Text>{kpi}</Text>
              <Flex justifyContent="start" alignItems="baseline" className="gap-2">
                <Metric className="text-[#003366] font-bold">${val.toLocaleString()}</Metric>
                <BadgeDelta deltaType={delta >= 0 ? "moderateIncrease" : "moderateDecrease"}>
                  {delta.toFixed(1)}%
                </BadgeDelta>
              </Flex>
              <Text className="mt-2 text-xs">vs mismo mes año anterior</Text>
            </Card>
          );
        })}
      </Grid>

      <Grid numItemsLg={3} className="gap-6">
        {/* Tabla Comparativa */}
        <Card className="col-span-2">
          <Title>Comparativo por Agencia - {selectedCategory}</Title>
          <Table className="mt-4">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Agencia</TableHeaderCell>
                <TableHeaderCell textAlignment="right">Valor {selectedMonth}</TableHeaderCell>
                <TableHeaderCell textAlignment="right">vs Mes Ant.</TableHeaderCell>
                <TableHeaderCell textAlignment="right">vs Año Ant.</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencias.map(a => {
                const vActual = getVal(selectedMonth, selectedCategory, a, 'Venta Total');
                const vMesAnt = getVal(prevMonth, selectedCategory, a, 'Venta Total');
                const vAñoAnt = getVal(prevYear, selectedCategory, a, 'Venta Total');
                const dMes = vMesAnt ? ((vActual - vMesAnt) / vMesAnt) * 100 : 0;
                const dAño = vAñoAnt ? ((vActual - vAñoAnt) / vAñoAnt) * 100 : 0;

                return (
                  <TableRow key={a}>
                    <TableCell className="font-medium">{a}</TableCell>
                    <TableCell textAlignment="right">${vActual.toLocaleString()}</TableCell>
                    <TableCell textAlignment="right">
                      <BadgeDelta deltaType={dMes >= 0 ? "subtleIncrease" : "subtleDecrease"}>{dMes.toFixed(1)}%</BadgeDelta>
                    </TableCell>
                    <TableCell textAlignment="right">
                      <BadgeDelta deltaType={dAño >= 0 ? "subtleIncrease" : "subtleDecrease"}>{dAño.toFixed(1)}%</BadgeDelta>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Gráfica */}
        <Card>
          <Title>Tendencia Mensual</Title>
          <AreaChart
            className="h-64 mt-4"
            data={meses.slice().reverse().map(m => ({ Mes: m, Venta: getVal(m, selectedCategory, selectedAgencia, 'Venta Total') }))}
            index="Mes"
            categories={["Venta"]}
            colors={["blue"]}
            showLegend={false}
          />
        </Card>
      </Grid>
    </div>
  );
}