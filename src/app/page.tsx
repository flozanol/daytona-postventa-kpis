'use client';
// @ts-nocheck

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Card, Title, Text, Metric, Flex, BadgeDelta, Grid,
  Select, SelectItem, TabGroup, TabList, Tab,
  Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell,
  AreaChart
} from '@tremor/react';

// Help structure for ordering months chronologically
const monthOrderMap = {
  ene: 0, enero: 0,
  feb: 1, febrero: 1,
  mar: 2, marzo: 2,
  abr: 3, abril: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5,
  jul: 6, julio: 6,
  ago: 7, agosto: 7,
  sep: 8, septiembre: 8,
  oct: 9, octubre: 9,
  nov: 10, noviembre: 10,
  dic: 11, diciembre: 11
};

const getMonthIndex = (m) => {
  if (!m) return -1;
  const lower = m.toLowerCase();
  for (const key in monthOrderMap) {
    if (lower.startsWith(key)) return monthOrderMap[key];
  }
  return -1;
};

// Types corresponding to Tab settings
const TIPOS_TABS = ['Todos', 'Normal', 'Garantía', 'Hojalatería y Pintura', 'Compañía de Seguros'];

export default function PostventaDashboard() {
  const [data, setData] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [meses, setMeses] = useState([]);

  const [selectedAgencia, setSelectedAgencia] = useState('Todas');
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedTipoIndex, setSelectedTipoIndex] = useState(0);

  useEffect(() => {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwcS4mh6qN2rqhcrnuBEssd5GIsEiXAp242OuqK9tuxEZfR_xRRJszCRbiDTUJIzbOwpkJpa4kqI4_/pub?gid=1096001978&single=true&output=csv";
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.filter(r => r.Mes && r.Agencia);
        setData(rows);
        
        const uniqueAgencias = [...new Set(rows.map(r => r.Agencia))].filter(Boolean).sort();
        setAgencias(uniqueAgencias);
        
        const uniqueMeses = [...new Set(rows.map(r => r.Mes))].filter(Boolean);
        uniqueMeses.sort((a, b) => {
          const [mA, yA] = a.split('-');
          const [mB, yB] = b.split('-');
          const dateA = new Date(parseInt(yA && yA.length === 2 ? `20${yA}` : yA), getMonthIndex(mA));
          const dateB = new Date(parseInt(yB && yB.length === 2 ? `20${yB}` : yB), getMonthIndex(mB));
          return dateA - dateB;
        });
        setMeses(uniqueMeses);
        
        if (uniqueMeses.length > 0) {
          setSelectedMes(uniqueMeses[uniqueMeses.length - 1]);
        }
      }
    });
  }, []);

  // Time Comparison Logic
  const getPreviousMonth = (mes) => {
    if (!mes) return '';
    const index = meses.indexOf(mes);
    if (index > 0) return meses[index - 1]; // Fallback to chronological previous available

    // Try to guess by string if not found sequentially
    const [m, y] = mes.split('-');
    const mIdx = getMonthIndex(m);
    let prevIdx = mIdx - 1;
    let targetYear = parseInt(y, 10);
    if (prevIdx < 0) {
      prevIdx = 11;
      targetYear--;
    }
    
    // Find matching month in unique months
    const match = meses.find(x => {
      const [xm, xy] = x.split('-');
      return getMonthIndex(xm) === prevIdx && parseInt(xy, 10) === targetYear;
    });
    return match || '';
  };

  const getSameMonthPreviousYear = (mes) => {
    if (!mes) return '';
    const [m, y] = mes.split('-');
    const mIdx = getMonthIndex(m);
    const targetYear = parseInt(y, 10) - 1;
    
    const match = meses.find(x => {
      const [xm, xy] = x.split('-');
      return getMonthIndex(xm) === mIdx && parseInt(xy, 10) === targetYear;
    });
    return match || '';
  };

  const parseValue = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    return parseFloat(clean) || 0;
  };

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchAgencia = selectedAgencia === 'Todas' || row.Agencia === selectedAgencia;
      const tipo = TIPOS_TABS[selectedTipoIndex];
      const matchTipo = tipo === 'Todos' || row.Tipo === tipo;
      return matchAgencia && matchTipo;
    });
  }, [data, selectedAgencia, selectedTipoIndex]);

  const getMetric = (kpiName, monthLabel, isAverage = false) => {
    const values = filteredData.filter(r => r.KPI === kpiName && r.Mes === monthLabel);
    const sum = values.reduce((acc, r) => acc + parseValue(r.Valor), 0);
    return isAverage && values.length > 0 ? sum / values.length : sum;
  };

  const calculateDelta = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getDeltaType = (delta) => {
    if (delta >= 5) return 'increase';
    if (delta > -5 && delta < 5) return 'unchanged';
    return 'decrease';
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  const formatPercentage = (val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

  // Variables for current, prev month, prev year
  const mesActual = selectedMes;
  const mesAnterior = getPreviousMonth(selectedMes);
  const mesAnioAnterior = getSameMonthPreviousYear(selectedMes);

  const ventaActual = getMetric('Total Venta', mesActual);
  const ventaAnteriorY = getMetric('Total Venta', mesAnioAnterior);
  const deltaVenta = calculateDelta(ventaActual, ventaAnteriorY);

  const ubActual = getMetric('UB Total', mesActual);
  const ubAnteriorY = getMetric('UB Total', mesAnioAnterior);
  const deltaUB = calculateDelta(ubActual, ubAnteriorY);

  const tkActual = getMetric('Ticket Promedio', mesActual, true);
  const tkAnteriorY = getMetric('Ticket Promedio', mesAnioAnterior, true);
  const deltaTk = calculateDelta(tkActual, tkAnteriorY);

  // Table Data
  const tableData = agencias.map(ag => {
    const tipo = TIPOS_TABS[selectedTipoIndex];
    const rowsAg = data.filter(r => r.Agencia === ag && (tipo === 'Todos' || r.Tipo === tipo));
    
    const getVal = (m) => rowsAg.filter(r => r.KPI === 'Total Venta' && r.Mes === m).reduce((s, r) => s + parseValue(r.Valor), 0);
    
    return {
      Agencia: ag,
      Actual: getVal(mesActual),
      Anterior: getVal(mesAnterior),
      AnioAnterior: getVal(mesAnioAnterior)
    };
  });

  // Chart Data
  const chartData = useMemo(() => {
    return meses.map(m => {
      const val = filteredData.filter(r => r.KPI === 'Total Venta' && r.Mes === m).reduce((acc, r) => acc + parseValue(r.Valor), 0);
      return { Mes: m, "Venta Total": val };
    });
  }, [filteredData, meses]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <Flex className="flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div>
            <Title className="text-3xl font-bold text-[#003366]">Dashboard KPI Postventa</Title>
            <Text>Monitoreo mensual de desempeño de agencias</Text>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Select 
              value={selectedAgencia} 
              onValueChange={setSelectedAgencia}
              className="w-full md:w-48"
            >
              <SelectItem value="Todas">Todas las Agencias</SelectItem>
              {agencias.map(ag => (
                <SelectItem key={ag} value={ag}>{ag}</SelectItem>
              ))}
            </Select>

            <Select 
              value={selectedMes} 
              onValueChange={setSelectedMes}
              className="w-full md:w-48"
            >
              {meses.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </Select>
          </div>
        </Flex>

        {/* Tipo Filter */}
        <TabGroup index={selectedTipoIndex} onIndexChange={setSelectedTipoIndex}>
          <TabList variant="solid" className="mb-6 bg-white shadow-sm rounded-lg p-1 border-gray-200 border">
            <Tab>Todos</Tab>
            <Tab>Normal</Tab>
            <Tab>Garantía</Tab>
            <Tab>Hojalatería y Pintura</Tab>
            <Tab>Seguros</Tab>
          </TabList>
        </TabGroup>

        {/* KPI Cards */}
        <Grid numItemsSm={1} numItemsLg={3} className="gap-6">
          <Card className="shadow-md border-t-4 border-t-[#003366] rounded-xl bg-white">
            <Text>Venta Total ({mesActual})</Text>
            <Flex className="items-baseline justify-start space-x-3 mt-2">
              <Metric className="text-[#003366]">{formatCurrency(ventaActual)}</Metric>
              <BadgeDelta deltaType={getDeltaType(deltaVenta)}>{formatPercentage(deltaVenta)} vs Año Ant.</BadgeDelta>
            </Flex>
          </Card>
          
          <Card className="shadow-md border-t-4 border-t-[#003366] rounded-xl bg-white">
            <Text>Utilidad Bruta ({mesActual})</Text>
            <Flex className="items-baseline justify-start space-x-3 mt-2">
              <Metric className="text-[#003366]">{formatCurrency(ubActual)}</Metric>
              <BadgeDelta deltaType={getDeltaType(deltaUB)}>{formatPercentage(deltaUB)} vs Año Ant.</BadgeDelta>
            </Flex>
          </Card>

          <Card className="shadow-md border-t-4 border-t-[#003366] rounded-xl bg-white">
            <Text>Ticket Promedio ({mesActual})</Text>
            <Flex className="items-baseline justify-start space-x-3 mt-2">
              <Metric className="text-[#003366]">{formatCurrency(tkActual)}</Metric>
              <BadgeDelta deltaType={getDeltaType(deltaTk)}>{formatPercentage(deltaTk)} vs Año Ant.</BadgeDelta>
            </Flex>
          </Card>
        </Grid>

        <div className="mt-6">
          {/* Chart */}
          <Card className="shadow-md rounded-xl bg-white">
            <Title className="text-[#003366]">Evolución Histórica - Venta Total</Title>
            <AreaChart
              className="h-80 mt-4"
              data={chartData}
              index="Mes"
              categories={["Venta Total"]}
              colors={["blue"]}
              valueFormatter={formatCurrency}
              showLegend={false}
              yAxisWidth={80}
            />
          </Card>
        </div>

        {/* Maestra Table */}
        <Card className="mt-6 shadow-md overflow-hidden rounded-xl bg-white">
          <Title className="text-[#003366]">Tabla Maestra (Venta Total) por Agencia</Title>
          <Text>Comparativa: Mes Actual vs Mes Anterior vs Mismo Mes Año Ant.</Text>
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="text-[#003366]">Agencia</TableHeaderCell>
                  <TableHeaderCell className="text-right text-[#003366]">Valor Mes Actual ({mesActual || '---'})</TableHeaderCell>
                  <TableHeaderCell className="text-right text-[#003366]">Mes Anterior ({mesAnterior || '---'})</TableHeaderCell>
                  <TableHeaderCell className="text-right text-[#003366]">Año Anterior ({mesAnioAnterior || '---'})</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.Agencia}>
                    <TableCell className="font-medium text-gray-800">{row.Agencia}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">{formatCurrency(row.Actual)}</TableCell>
                    <TableCell className="text-right text-gray-600">{formatCurrency(row.Anterior)}</TableCell>
                    <TableCell className="text-right text-gray-600">{formatCurrency(row.AnioAnterior)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
