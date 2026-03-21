'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Card, Title, Text, Metric, Grid, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, BadgeDelta, TabGroup, TabList, Tab, Select, SelectItem, Flex, AreaChart } from "@tremor/react";
import { ArrowLeftRight, TrendingUp, DollarSign } from 'lucide-react';

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
      complete: (results) => {
        // Limpiamos datos vacíos y formateamos
        const cleanedData = results.data.filter(d => d.Agencia && d.Mes && d.KPI);
        setData(cleanedData);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error parseando CSV:', error);
        setLoading(false);
      }
    });
  }, []);

  // --- LÓGICA DE DATOS (El 'Cerebro' del Dashboard) ---
  const getValuesForPeriod = (monthStr, category, agencia, kpiName) => {
    let filtered = data.filter(d => d.Mes === monthStr && d.Tipo === category && d.KPI === kpiName);
    if (agencia !== 'Todas') {
      filtered = filtered.filter(d => d.Agencia === agencia);
    }
    // Sumamos por si hay múltiples entradas
    return filtered.reduce((sum, item) => sum + (item.Valor || 0), 0);
  };

  const calculateDelta = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Definimos meses para comparar (ej: Feb-26 -> Feb-25)
  const getPrevYearMonth = (monthStr) => {
    const [mes, año] = monthStr.split('-');
    const prevAño = parseInt(año) - 1;
    return `${mes}-${prevAño}`;
  };

  if (loading) return <div className="p-10 text-center">Cargando KPIs de Grupo Daytona...</div>;
  if (data.length === 0) return <div className="p-10 text-center text-red-500">No se encontraron datos en el CSV. Revisa la publicación de Google Sheets.</div>;

  const prevYearMonth = getPrevYearMonth(selectedMonth);

  // --- DATOS PARA LAS TARJETAS PRINCIPALES ---
  const kpis = [
    { name: 'Venta Total', icon: DollarSign, unit: '$' },
    { name: 'Utilidad Bruta', icon: TrendingUp, unit: '$' },
    { name: 'Ticket Promedio', icon: ArrowLeftRight, unit: '$' }
  ];

  // --- DATOS PARA LA TABLA MAESTRA ---
  const agencias = [...new Set(data.map(d => d.Agencia))].sort();
  const tableData = agencias.map(agencia => {
    const currentVenta = getValuesForPeriod(selectedMonth, selectedCategory, agencia, 'Venta Total');
    const prevYearVenta = getValuesForPeriod(prevYearMonth, selectedCategory, agencia, 'Venta Total');
    return {
      name: agencia,
      current: currentVenta,
      prevYear: prevYearVenta,
      delta: calculateDelta(currentVenta, prevYearVenta)
    };
  });

  // --- DATOS PARA LA GRÁFICA DE TENDENCIA ---
  const monthsTrend = [...new Set(data.filter(d => d.Tipo === selectedCategory && d.KPI === 'Venta Total').map(d => d.Mes))];
  const trendData = monthsTrend.map(month => ({
    Mes: month,
    "Venta Total": getValuesForPeriod(month, selectedCategory, 'Todas', 'Venta Total')
  }));

  const categories = ['Normal', 'Garantía', 'H&P', 'Seguros'];
  const months = [...new Set(data.map(d => d.Mes))].reverse(); // Feb-26 primero

  return (
    <main className="p-6 md:p-10 bg-slate-50 min-h-screen">
      {/* CABECERA Y FILTROS */}
      <Flex className="border-b border-slate-200 pb-6 mb-8 gap-4 flex-col md:flex-row items-start md:items-center">
        <div>
          <Title className="text-3xl font-bold text-slate-900">KPIs Postventa - Grupo Daytona</Title>
          <Text className="text-slate-600 mt-1">Análisis de Desempeño y Comparativa Temporal</Text>
        </div>
        <Flex className="gap-3 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} className="max-w-[150px]">
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </Select>
          <Select value={selectedAgencia} onValueChange={setSelectedAgencia} className="max-w-[200px]">
            <SelectItem value="Todas">Todas las Agencias</SelectItem>
            {agencias.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </Select>
        </Flex>
      </Flex>

      {/* SELECTOR DE CATEGORÍA (TABS) */}
      <TabGroup index={categories.indexOf(selectedCategory)} onIndexChange={(i) => setSelectedCategory(categories[i])} className="mb-8">
        <TabList variant="line">
          {categories.map(cat => <Tab key={cat}>{cat}</Tab>)}
        </TabList>
      </TabGroup>

      {/* TARJETAS PRINCIPALES (KPI CARDS) */}
      <Grid numItemsMd={3} className="gap-6 mb-8">
        {kpis.map((kpi) => {
          const currentValue = getValuesForPeriod(selectedMonth, selectedCategory, selectedAgencia, kpi.name);
          const prevYearValue = getValuesForPeriod(prevYearMonth, selectedCategory, selectedAgencia, kpi.name);
          const delta = calculateDelta(currentValue, prevYearValue);

          return (
            <Card key={kpi.name} decoration="top" decorationColor="blue">
              <Flex alignItems="start">
                <div>
                  <Text className="font-medium text-slate-600">{kpi.name} ({selectedCategory})</Text>
                  <Metric className="font-bold text-3xl text-daytonaBlue">
                    {kpi.unit}{currentValue.toLocaleString('es-MX')}
                  </Metric>
                </div>
                <BadgeDelta deltaType={delta >= 0 ? "moderateIncrease" : "moderateDecrease"}>
                  {delta.toFixed(1)}% vs {prevYearMonth}
                </BadgeDelta>
              </Flex>
            </Card>
          );
        })}
      </Grid>

      <Grid numItemsLg={3} className="gap-6">
        {/* TABLA MAESTRA DE AGENCIAS */}
        <Card className="col-span-2">
          <Title>Comparativo Inter-Agencias: {selectedCategory}</Title>
          <Table className="mt-5">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Agencia</TableHeaderCell>
                <TableHeaderCell textAlignment="right">{selectedMonth}</TableHeaderCell>
                <TableHeaderCell textAlignment="right">{prevYearMonth} (Año Ant.)</TableHeaderCell>
                <TableHeaderCell textAlignment="right">Variación Anual</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                  <TableCell textAlignment="right">${item.current.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">${item.prevYear.toLocaleString('es-MX')}</TableCell>
                  <TableCell textAlignment="right">
                    <BadgeDelta deltaType={item.delta >= 0 ? "moderateIncrease" : "moderateDecrease"}>
                      {item.delta.toFixed(1)}%
                    </BadgeDelta>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* GRÁFICA DE TENDENCIA */}
        <Card>
          <Title>Tendencia Histórica: Venta Total ({selectedCategory})</Title>
          <AreaChart
            className="h-72 mt-6"
            data={trendData}
            index="Mes"
            categories={["Venta Total"]}
            colors={["blue"]}
            valueFormatter={(number) => `$${number.toLocaleString('es-MX')}`}
            showLegend={false}
          />
        </Card>
      </Grid>
    </main>
  );
}