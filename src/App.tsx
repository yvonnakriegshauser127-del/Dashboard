import React from 'react';
import {
  ConfigProvider, Layout, Typography, Space, Select, DatePicker, Button,
  Dropdown, Checkbox, Card, Input, Divider, Tooltip, Badge, Radio
} from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { MenuProps } from 'antd';
import { DownOutlined, UpOutlined, InfoCircleOutlined, LeftCircleOutlined, RightCircleOutlined, SettingOutlined, DeleteOutlined, SaveOutlined, PlusCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import Chart from 'chart.js/auto';
// @ts-ignore
import { CrosshairPlugin } from 'chartjs-plugin-crosshair';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Register Chart.js plugins
Chart.register(CrosshairPlugin);

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;

// Helper function to check if the selected period is a default preset
const isDefaultPreset = (dateRange: [Dayjs, Dayjs] | null): boolean => {
  if (!dateRange) return false;
  
  const [start, end] = dateRange;
  const today = dayjs();
  
  // Check if it matches any default presets
  const isToday = start.isSame(today.startOf('day')) && end.isSame(today.endOf('day'));
  const isYesterday = start.isSame(today.subtract(1, 'day').startOf('day')) && end.isSame(today.subtract(1, 'day').endOf('day'));
  const isThisWeek = start.isSame(today.startOf('week')) && end.isSame(today.endOf('week'));
  const isLastWeek = start.isSame(today.subtract(1, 'week').startOf('week')) && end.isSame(today.subtract(1, 'week').endOf('week'));
  const isThisMonth = start.isSame(today.startOf('month')) && end.isSame(today.endOf('month'));
  const isLastMonth = start.isSame(today.subtract(1, 'month').startOf('month')) && end.isSame(today.subtract(1, 'month').endOf('month'));
  const isLast3Months = start.isSame(today.subtract(3, 'month').startOf('month')) && end.isSame(today.endOf('month'));
  const isSeptember2025 = start.isSame(dayjs('2025-09-01').startOf('day')) && end.isSame(dayjs('2025-09-30').endOf('day'));
  
  return isToday || isYesterday || isThisWeek || isLastWeek || isThisMonth || isLastMonth || isLast3Months || isSeptember2025;
};

// Helper function to get the axis type based on period and user choice
const getDateRangeType = (dateRange: [Dayjs, Dayjs] | null, userAxisType?: 'day' | 'week' | 'month'): 'day' | 'week' | 'month' | null => {
  if (!dateRange) return null;
  
  const [start, end] = dateRange;
  const diffInDays = end.diff(start, 'day') + 1; // +1 to include both start and end days
  
  // If user has custom period and specified axis type, use it (with validation)
  if (!isDefaultPreset(dateRange) && userAxisType) {
    // Validate that the chosen axis type makes sense for the period
    if (userAxisType === 'week' && diffInDays <= 7) return 'day';
    if (userAxisType === 'month' && diffInDays <= 31) return diffInDays <= 7 ? 'day' : 'week';
    return userAxisType;
  }
  
  // For default presets, use automatic logic
  const today = dayjs();
  const isToday = start.isSame(today.startOf('day')) && end.isSame(today.endOf('day'));
  const isYesterday = start.isSame(today.subtract(1, 'day').startOf('day')) && end.isSame(today.subtract(1, 'day').endOf('day'));
  const isThisWeek = start.isSame(today.startOf('week')) && end.isSame(today.endOf('week'));
  const isLastWeek = start.isSame(today.subtract(1, 'week').startOf('week')) && end.isSame(today.subtract(1, 'week').endOf('week'));
  const isThisMonth = start.isSame(today.startOf('month')) && end.isSame(today.endOf('month'));
  const isLastMonth = start.isSame(today.subtract(1, 'month').startOf('month')) && end.isSame(today.subtract(1, 'month').endOf('month'));
  const isLast3Months = start.isSame(today.subtract(3, 'month').startOf('month')) && end.isSame(today.endOf('month'));
  
  // Default presets logic
  if (isToday || isYesterday || isThisWeek || isLastWeek || isThisMonth || isLastMonth) {
    return 'day';
  }
  if (isLast3Months) {
    return 'week';
  }
  
  // Custom period fallback logic
  if (diffInDays <= 31) {
    return 'day';
  } else if (diffInDays <= 93) { // ~3 months
    return 'week';
  } else {
    return 'month';
  }
};

// Enhanced function to build labels based on period type
const buildLabelsWithPeriodType = (dateRange: [Dayjs, Dayjs] | null, userAxisType?: 'day' | 'week' | 'month'): string[] => {
  if (!dateRange) return [dayjs().format('DD.MM')];
  
  const [start, end] = dateRange;
  const periodType = getDateRangeType(dateRange, userAxisType);
  const labels: string[] = [];
  
  switch (periodType) {
    case 'day': {
      let d = start.startOf('day');
      const last = end.endOf('day');
      while (d.isBefore(last) || d.isSame(last, 'day')) {
        labels.push(d.format('DD.MM'));
        d = d.add(1, 'day');
      }
      break;
    }
    case 'week': {
      let d = start.startOf('week');
      const last = end.endOf('day');
      while (d.isBefore(last) || d.isSame(last, 'week')) {
        const weekEnd = d.endOf('week');
        const displayStart = d.isAfter(start) ? d : start;
        const displayEnd = weekEnd.isAfter(end) ? end : weekEnd;
        labels.push(`${displayStart.format('DD.MM')}-${displayEnd.format('DD.MM')}`);
        d = d.add(1, 'week');
      }
      break;
    }
    case 'month': {
      let d = start.startOf('month');
      const last = end.endOf('day');
      while (d.isBefore(last) || d.isSame(last, 'month')) {
        labels.push(d.format('MMM YYYY'));
        d = d.add(1, 'month');
      }
      break;
    }
    default: {
      // Fallback to day-by-day
      let d = start.startOf('day');
      const last = end.endOf('day');
      while (d.isBefore(last) || d.isSame(last, 'day')) {
        labels.push(d.format('DD.MM'));
        d = d.add(1, 'day');
      }
    }
  }
  
  return labels;
};

const appTheme = {
  token: {
    colorPrimary: '#007bff',
    colorInfo: '#007bff',
    colorSuccess: '#00b746',
    colorError: '#dd0404',
    colorWarning: '#f3af00',
    colorTextBase: '#001029',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8f8f8',
    colorBorder: '#D9D9D9',
    fontFamily: 'Rubik, Arial, sans-serif',
    fontSize: 14,
    borderRadius: 16,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    controlHeight: 30,
    controlHeightLG: 40,
  }
};

type CompanyStatus = 'Active' | 'Pending' | 'Completed';
const companyStatusColor: Record<CompanyStatus, string> = {
  Active: '#00b746',
  Pending: '#f3af00',
  Completed: '#8B0000',
};
const baseCompanyOptions: { value: string; status: CompanyStatus; start: string; end: string }[] = [
  { value: 'Amazon', status: 'Active', start: dayjs().subtract(20, 'day').format('YYYY-MM-DD'), end: dayjs().add(10, 'day').format('YYYY-MM-DD') },
  { value: 'eBay', status: 'Pending', start: dayjs().add(5, 'day').format('YYYY-MM-DD'), end: dayjs().add(35, 'day').format('YYYY-MM-DD') },
  { value: 'Shopify', status: 'Completed', start: dayjs().subtract(60, 'day').format('YYYY-MM-DD'), end: dayjs().subtract(30, 'day').format('YYYY-MM-DD') },
];
const companyOptions = baseCompanyOptions.map(o => ({
  value: o.value,
  label: (
    <span style={{ display: 'inline-flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Tooltip title={o.status}>
          <span style={{ width: 12, height: 12, background: companyStatusColor[o.status], borderRadius: 2, marginRight: 8, flex: '0 0 12px' }} />
        </Tooltip>
        <span>{o.value}</span>
      </span>
      <Tooltip title={`${dayjs(o.start).format('DD.MM.YY')} - ${dayjs(o.end).format('DD.MM.YY')}`}>
        <InfoCircleOutlined style={{ color: '#999', fontSize: 14, marginLeft: 8 }} />
      </Tooltip>
    </span>
  )
}));
const bloggerOptions = [
  { value: 'Иван Иванов', label: 'Иван Иванов' },
  { value: 'Мария Смирнова', label: 'Мария Смирнова' },
];
// asinOptions will be derived later after detailsRowsBase is declared
let asinOptions: { value: string; label: string }[] = [];
// linkOptions will be generated dynamically from contentRowsBase

// Default metrics (will be calculated after data is defined)
const prevM = { Spend:1774.18, Clicks:3249, Units:120, Sales:8065.07, Conversion:'12%', 'Commision Rate':'5%', Profit:3200, 'Promotional Costs': 650.00, 'Total expenses': 2424.18 } as const;
const curM  = { Spend:3372.42, Clicks:6200, Units:100, Sales:15450.24, Conversion:'15%', 'Commision Rate':'7%', Profit:5400, 'Promotional Costs': 980.00, 'Total expenses': 4352.42 } as const;
const allMetrics = Object.keys(prevM) as Array<keyof typeof prevM>;

function MetricCard({ title, value, prev }: { title: string; value: number|string; prev: number|string }) {
  let comparison: React.ReactNode = null;
  if (typeof value === 'number' && typeof prev === 'number') {
    const diff = value - prev;
    const up = diff >= 0;
    const color = up ? '#00b746' : '#dd0404';
    const arrow = up ? '↑' : '↓';
    comparison = <div style={{ color, marginTop: 6 }}>{arrow} {Math.abs(diff).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</div>;
  }
  const display =
    title === 'Clicks' || title === 'Units'
      ? (value as number).toLocaleString('ru-RU')
      : (typeof value === 'number' ? `$${value.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}` : value);

  return (
    <Card size="small" style={{ height: 130 }}>
      <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
      <Typography.Text style={{ fontSize: 20, fontWeight: 600, color: '#007bff' }}>{display}</Typography.Text>
      {comparison}
    </Card>
  );
}

function ChartCard({ dateRange, collapsed, axisType }: { dateRange: [Dayjs, Dayjs] | null; collapsed: boolean; axisType?: 'day' | 'week' | 'month' }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [checks, setChecks] = React.useState<{ spend: boolean; profit: boolean; orders: boolean; none: boolean }>({ spend: true, profit: true, orders: true, none: false });
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    return buildLabelsWithPeriodType(dateRange, axisType);
  }, [dateRange, axisType]);

  const buildDatasets = React.useCallback((labels: string[]) => {
    const generateRealisticData = (baseValue: number, volatility: number = 0.15) => {
      return labels.map((_, index) => {
        // Add some realistic variation with trend
        const trend = Math.sin(index / labels.length * Math.PI * 2) * 0.1; // Seasonal trend
        const random = (Math.random() - 0.5) * volatility; // Random variation
        const dayOfWeek = index % 7; // Weekend effect
        const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -0.1 : 0.05; // Lower on weekends
        
        return Math.max(0, baseValue * (1 + trend + random + weekendEffect));
      });
    };

    const moneySelected = checks.spend || checks.profit;
    const countSelected = checks.orders;
    const bothUnits = moneySelected && countSelected;
    const yLeftId = 'yLeftTop';
    const yRightId = 'yRightTop';
    const datasets: any[] = [];
    
    const addPair = (name: string, baseValue: number, color: string, yAxisID: string, volatility: number = 0.15) => {
      const data = generateRealisticData(baseValue, volatility);
      // Bar layer (hidden from legend)
      datasets.push({
        label: `${name} bars`,
        data,
        yAxisID,
        type: 'bar',
        backgroundColor: color + '55',
        borderColor: color,
        maxBarThickness: 25,
        categoryPercentage: 0.6,
        barPercentage: 0.8,
        isBar: true,
        order: 1,
      });
      // Line overlay
      datasets.push({
        label: name,
        data,
        yAxisID,
        type: 'line',
        borderColor: color,
        backgroundColor: color + '33',
        fill: false,
        tension: 0.3,
        order: 2,
      });
    };
    
    if (checks.spend) addPair('Spend', curM.Spend, '#1f77b4', bothUnits ? yLeftId : yLeftId, 0.2);
    if (checks.profit) addPair('Profit', curM.Profit, '#ff7f0e', bothUnits ? yLeftId : yLeftId, 0.25);
    if (checks.orders) addPair('Units', curM.Units, '#33a02c', bothUnits ? yRightId : yLeftId, 0.3);
    return { datasets, moneySelected, countSelected, bothUnits, yLeftId, yRightId };
  }, [checks]);

  React.useEffect(() => {
    // Recreate or destroy chart based on collapsed state
    chartRef.current?.destroy();
    if (!canvasRef.current || collapsed) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const labels = buildLabels();
    const { datasets, moneySelected, countSelected, bothUnits, yLeftId, yRightId } = buildDatasets(labels);
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              filter: (item: any) => {
                return !item.text?.includes(' bars');
              }
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            filter: function(tooltipItem: any) {
              return !tooltipItem.dataset.label?.includes(' bars');
            },
            callbacks: {
              title: function(context: any) {
                return context[0].label;
              },
              label: function(context: any) {
                const label = context.dataset.label || '';
                if (label.includes(' bars')) return undefined; // Hide bar dataset tooltips
                let value = context.parsed.y;
                if (label === 'Spend' || label === 'Profit') {
                  return `${label}: $${value.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}`;
                } else {
                  return `${label}: ${value.toLocaleString('ru-RU')}`;
                }
              }
            }
          },
          // @ts-ignore
          crosshair: {
            line: {
              color: '#666',
              width: 1,
              dashPattern: [5, 5]
            },
            sync: {
              enabled: true
            },
            zoom: {
              enabled: false
            }
          }
        },
        scales: {
          [yLeftId]:  { position: 'left',  display: moneySelected || (!moneySelected && !countSelected), ticks: { callback: (val: any) => `$${(+val).toFixed(2)}` } },
          [yRightId]: { position: 'right', display: bothUnits, ticks: { callback: (val: any) => `${(+val).toFixed(0)}` } },
        },
        onHover: (event: any, activeElements: any) => {
          ctx.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [collapsed]);

  React.useEffect(() => {
    if (!chartRef.current) return;
    const labels = buildLabels();
    const { datasets, moneySelected, countSelected, bothUnits, yLeftId, yRightId } = buildDatasets(labels);
    chartRef.current.data.labels = labels;
    chartRef.current.data.datasets = datasets as any;
    const opt: any = chartRef.current.options;
    if (opt.scales) {
      if (opt.scales[yLeftId]) opt.scales[yLeftId].display = moneySelected || (!moneySelected && !countSelected);
      if (opt.scales[yRightId]) opt.scales[yRightId].display = bothUnits;
    }
    chartRef.current.update();
  }, [dateRange, checks, buildLabels, buildDatasets]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'spend',
      label: (
        <Checkbox onClick={e => e.stopPropagation()} checked={checks.spend} onChange={e => { const next = { ...checks, spend: e.target.checked }; if (next.spend || next.profit || next.orders) next.none = false; setChecks(next); }}>
          Spend
        </Checkbox>
      ),
    },
    {
      key: 'profit',
      label: (
        <Checkbox onClick={e => e.stopPropagation()} checked={checks.profit} onChange={e => { const next = { ...checks, profit: e.target.checked }; if (next.spend || next.profit || next.orders) next.none = false; setChecks(next); }}>
          Profit
        </Checkbox>
      ),
    },
    {
      key: 'orders',
      label: (
        <Checkbox onClick={e => e.stopPropagation()} checked={checks.orders} onChange={e => { const next = { ...checks, orders: e.target.checked }; if (next.spend || next.profit || next.orders) next.none = false; setChecks(next); }}>
          Units
        </Checkbox>
      ),
    },
    {
      key: 'none',
      label: (
        <Checkbox onClick={e => e.stopPropagation()} checked={checks.none} onChange={e => { const isChecked = e.target.checked; if (isChecked) setChecks({ spend: false, profit: false, orders: false, none: true }); else setChecks({ ...checks, none: false }); }}>
          None
        </Checkbox>
      ),
    },
  ];

  const toggleCollapsed = () => {
    try { localStorage.setItem('chartsCollapsed', JSON.stringify(!collapsed)); } catch {}
    // notify other components (ChartsBlock listens to storage)
    window.dispatchEvent(new StorageEvent('storage', { key: 'chartsCollapsed', newValue: JSON.stringify(!collapsed) } as any));
  };

  return (
    <Card
      title={collapsed ? "Charts" : "Campaign Performance"}
      style={{ maxWidth: 1600, margin: '0 auto' }}
      styles={{ body: collapsed ? { display: 'none', padding: 0 } : undefined }}
      extra={
        <Button type="text" onClick={toggleCollapsed}>
          {collapsed ? <DownOutlined /> : <UpOutlined />}
        </Button>
      }
    >
      {!collapsed && (
        <Space style={{ marginBottom: 12 }}>
          <Dropdown menu={{ items: menuItems }} open={dropOpen} onOpenChange={setDropOpen} trigger={["click"]}>
            <Button>Spend/Profit/Units <DownOutlined /></Button>
          </Dropdown>
        </Space>
      )}
      <canvas ref={canvasRef} style={{ display: collapsed ? 'none' : 'block' }} />
    </Card>
  );
}

function SecondaryChart({ dateRange, axisType }: { dateRange: [Dayjs, Dayjs] | null; axisType?: 'day' | 'week' | 'month' }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [checks, setChecks] = React.useState<{ clicks: boolean; orders: boolean; conversion: boolean; none: boolean }>({ clicks: true, orders: true, conversion: true, none: false });
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    return buildLabelsWithPeriodType(dateRange, axisType);
  }, [dateRange, axisType]);

  const buildDatasets = React.useCallback((labels: string[]) => {
    const generateRealisticData = (baseValue: number, volatility: number = 0.15, isPercentage: boolean = false) => {
      return labels.map((_, index) => {
        // Add some realistic variation with trend
        const trend = Math.sin(index / labels.length * Math.PI * 2) * 0.1; // Seasonal trend
        const random = (Math.random() - 0.5) * volatility; // Random variation
        const dayOfWeek = index % 7; // Weekend effect
        const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -0.1 : 0.05; // Lower on weekends
        
        const value = Math.max(0, baseValue * (1 + trend + random + weekendEffect));
        return isPercentage ? Math.round(value * 10) / 10 : Math.round(value);
      });
    };

    const selectedUnits: ('count' | 'percent')[] = [];
    if (checks.clicks) selectedUnits.push('count');
    if (checks.orders) selectedUnits.push('count');
    if (checks.conversion) selectedUnits.push('percent');
    const hasPercent = selectedUnits.includes('percent');
    const hasCount = selectedUnits.includes('count');

    const yLeftId = 'yLeft2';
    const yRightId = 'yRight2';

    const datasets: any[] = [];
    const addPair = (name: string, baseValue: number, color: string, yAxisID: string, volatility: number = 0.15, isPercentage: boolean = false) => {
      const data = generateRealisticData(baseValue, volatility, isPercentage);
      datasets.push({ 
        label: `${name} bars`, 
        data, 
        yAxisID, 
        type: 'bar', 
        backgroundColor: color + '55', 
        borderColor: color, 
        isBar: true, 
        order: 1, 
        maxBarThickness: 25, 
        categoryPercentage: 0.6, 
        barPercentage: 0.8 
      });
      datasets.push({ 
        label: name, 
        data, 
        yAxisID, 
        type: 'line', 
        borderColor: color, 
        backgroundColor: color + '33', 
        fill: false, 
        tension: 0.3, 
        order: 2 
      });
    };
    
    if (checks.clicks) addPair('Clicks', 200, '#1f77b4', hasPercent && hasCount ? yLeftId : yLeftId, 0.2);
    if (checks.orders) addPair('Units', 50, '#33a02c', hasPercent && hasCount ? yLeftId : yLeftId, 0.3);
    if (checks.conversion) addPair('Conversion', 5, '#ff7f0e', hasPercent && hasCount ? yRightId : yLeftId, 0.2, true);

    return { datasets, hasPercent, hasCount, yLeftId, yRightId };
  }, [checks]);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const labels = buildLabels();
    const { datasets, hasPercent, hasCount, yLeftId, yRightId } = buildDatasets(labels);
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              filter: (item: any) => {
                return !item.text?.includes(' bars');
              },
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            filter: function(tooltipItem: any) {
              return !tooltipItem.dataset.label?.includes(' bars');
            },
            callbacks: {
              title: function(context: any) {
                return context[0].label;
              },
              label: function(context: any) {
                const label = context.dataset.label || '';
                if (label.includes(' bars')) return undefined; // Hide bar dataset tooltips
                let value = context.parsed.y;
                if (label === 'Conversion') {
                  return `${label}: ${value.toFixed(1)}%`;
                } else {
                  return `${label}: ${value.toLocaleString('ru-RU')}`;
                }
              }
            }
          },
          // @ts-ignore
          crosshair: {
            line: {
              color: '#666',
              width: 1,
              dashPattern: [5, 5]
            },
            sync: {
              enabled: true
            },
            zoom: {
              enabled: false
            }
          }
        },
        scales: {
          [yLeftId]: { position: 'left', display: hasCount || (!hasCount && !hasPercent), ticks: { callback: (val: any) => `${(+val).toFixed(0)}` } },
          [yRightId]: { position: 'right', display: hasPercent && hasCount, ticks: { callback: (val: any) => `${(+val).toFixed(1)}%` } },
        },
        onHover: (event: any, activeElements: any) => {
          ctx.canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, []);

  React.useEffect(() => {
    if (!chartRef.current) return;
    const labels = buildLabels();
    const { datasets, hasPercent, hasCount, yLeftId, yRightId } = buildDatasets(labels);
    chartRef.current.data.labels = labels;
    chartRef.current.data.datasets = datasets as any;
    const opt: any = chartRef.current.options;
    if (opt.scales) {
      if (opt.scales[yLeftId]) opt.scales[yLeftId].display = hasCount || (!hasCount && !hasPercent);
      if (opt.scales[yRightId]) opt.scales[yRightId].display = hasPercent && hasCount;
    }
    chartRef.current.update();
  }, [dateRange, checks, buildLabels, buildDatasets]);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'clicks',
      label: (
        <Checkbox
          onClick={e => e.stopPropagation()}
          checked={checks.clicks}
          onChange={e => {
            const next = { ...checks, clicks: e.target.checked };
            if (next.clicks || next.orders || next.conversion) next.none = false;
            setChecks(next);
          }}
        >
          Clicks
        </Checkbox>
      ),
    },
    {
      key: 'orders',
      label: (
        <Checkbox
          onClick={e => e.stopPropagation()}
          checked={checks.orders}
          onChange={e => {
            const next = { ...checks, orders: e.target.checked };
            if (next.clicks || next.orders || next.conversion) next.none = false;
            setChecks(next);
          }}
        >
          Units
        </Checkbox>
      ),
    },
    {
      key: 'conversion',
      label: (
        <Checkbox
          onClick={e => e.stopPropagation()}
          checked={checks.conversion}
          onChange={e => {
            const next = { ...checks, conversion: e.target.checked };
            if (next.clicks || next.orders || next.conversion) next.none = false;
            setChecks(next);
          }}
        >
          Conversion
        </Checkbox>
      ),
    },
    {
      key: 'none',
      label: (
        <Checkbox
          onClick={e => e.stopPropagation()}
          checked={checks.none}
          onChange={e => {
            const checked = e.target.checked;
            if (checked) setChecks({ clicks: false, orders: false, conversion: false, none: true }); else setChecks({ ...checks, none: false });
          }}
        >
          None
        </Checkbox>
      ),
    },
  ];

  return (
    <Card title="Engagement Metrics" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <Space style={{ marginBottom: 12 }}>
        <Dropdown menu={{ items: dropdownItems }} open={dropOpen} onOpenChange={setDropOpen} trigger={["click"]}>
          <Button>Clicks/Units/Conversion <DownOutlined /></Button>
        </Dropdown>
      </Space>
      <canvas ref={canvasRef} />
    </Card>
  );
}

function UnifiedChart({ 
  dateRange, 
  collapsed, 
  chartId, 
  checks,
  onChecksChange,
  onDelete,
  axisType
}: { 
  dateRange: [Dayjs, Dayjs] | null; 
  collapsed: boolean;
  chartId: string;
  axisType: 'day' | 'week' | 'month';
  checks: { 
    spend: boolean; 
    profit: boolean; 
    orders: boolean; 
    clicks: boolean; 
    conversion: boolean; 
    totalExpenses: boolean;
    none: boolean 
  };
  onChecksChange: (next: { 
    spend: boolean; 
    profit: boolean; 
    orders: boolean; 
    clicks: boolean; 
    conversion: boolean; 
    totalExpenses: boolean;
    none: boolean 
  }) => void;
  onDelete?: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    return buildLabelsWithPeriodType(dateRange, axisType);
  }, [dateRange, axisType]);

  const buildDatasets = React.useCallback((labels: string[]) => {
    const generateRealisticData = (baseValue: number, volatility: number = 0.15, isPercentage: boolean = false) => {
      return labels.map((_, index) => {
        // Add some realistic variation with trend
        const trend = Math.sin(index / labels.length * Math.PI * 2) * 0.1; // Seasonal trend
        const random = (Math.random() - 0.5) * volatility; // Random variation
        const dayOfWeek = index % 7; // Weekend effect
        const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -0.1 : 0.05; // Lower on weekends
        
        const value = Math.max(0, baseValue * (1 + trend + random + weekendEffect));
        return isPercentage ? Math.round(value * 10) / 10 : Math.round(value);
      });
    };

    const moneySelected = checks.spend || checks.profit || checks.totalExpenses;
    const countSelected = checks.orders || checks.clicks;
    const percentSelected = checks.conversion;
    
    const yLeftId = 'yLeftUnified';
    const yRightId = 'yRightUnified';
    const yPercentId = 'yPercentUnified';

    const datasets: any[] = [];
    
    const addPair = (name: string, baseValue: number, color: string, yAxisID: string, volatility: number = 0.15, isPercentage: boolean = false) => {
      const data = generateRealisticData(baseValue, volatility, isPercentage);
      // Bar layer (hidden from legend)
      datasets.push({
        label: `${name} bars`,
        data,
        yAxisID,
        type: 'bar',
        backgroundColor: color + '55',
        borderColor: color,
        maxBarThickness: 25,
        order: 2,
      });
      // Line layer
      datasets.push({
        label: name,
        data,
        yAxisID,
        type: 'line',
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.1,
        order: 1,
      });
    };

    if (checks.spend) addPair('Spend', 500, '#1890ff', yLeftId, 0.2);
    if (checks.profit) addPair('Profit', 200, '#52c41a', yLeftId, 0.25);
    if (checks.totalExpenses) addPair('Total expenses', 700, '#ff4d4f', yLeftId, 0.2);
    if (checks.orders) addPair('Units', 15, '#fa8c16', yRightId, 0.3);
    if (checks.clicks) addPair('Clicks', 100, '#722ed1', yRightId, 0.2);
    if (checks.conversion) addPair('Conversion', 15, '#eb2f96', yPercentId, 0.15, true);

    return datasets;
  }, [checks]);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = buildLabels();
    const datasets = buildDatasets(labels);

    const moneySelected = checks.spend || checks.profit || checks.totalExpenses;
    const countSelected = checks.orders || checks.clicks;
    const percentSelected = checks.conversion;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              filter: function(item: any) {
                return !item.text.includes(' bars');
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            filter: function(tooltipItem: any) {
              return !tooltipItem.dataset.label?.includes(' bars');
            },
            callbacks: {
              title: function(context: any) {
                return context[0].label;
              },
              label: function(context: any) {
                const label = context.dataset.label || '';
                if (label.includes(' bars')) return undefined;
                let value = context.parsed.y;
                let formattedValue = value;
                
                if (label === 'Spend' || label === 'Profit' || label === 'Total expenses') {
                  formattedValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } else if (label === 'Conversion') {
                  formattedValue = `${value}%`;
                } else {
                  formattedValue = value.toLocaleString('en-US');
                }
                
                return `${label}: ${formattedValue}`;
              }
            }
          },
          // @ts-ignore
          crosshair: {
            line: {
              color: '#666',
              width: 1,
              dashPattern: [5, 5]
            },
            sync: {
              enabled: true
            },
            zoom: {
              enabled: false
            }
          }
        },
        scales: {
          yLeftUnified: {
            type: 'linear',
            display: moneySelected,
            position: 'left',
            title: {
              display: true,
              text: 'Spend, Profit & Total expenses ($)',
              color: '#666'
            },
            grid: {
              drawOnChartArea: true,
            },
          },
          yRightUnified: {
            type: 'linear',
            display: countSelected,
            position: 'right',
            title: {
              display: true,
              text: 'Units & Clicks',
              color: '#666'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          yPercentUnified: {
            type: 'linear',
            display: percentSelected && !countSelected,
            position: 'right',
            title: {
              display: true,
              text: 'Conversion (%)',
              color: '#666'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              color: '#666'
            }
          }
        },
        onHover: (event: any, activeElements: any) => {
          if (event.native && event.native.target) {
            if (activeElements.length > 0) {
              event.native.target.style.cursor = 'crosshair';
            } else {
              event.native.target.style.cursor = 'default';
            }
          }
        }
      }
    });
  }, [buildLabels, buildDatasets, checks]);

  const handleMetricChange = (metric: keyof typeof checks, checked: boolean) => {
    if (metric === 'none') {
      if (checked) {
        // If None is checked, uncheck all others
        onChecksChange({ spend: false, profit: false, orders: false, clicks: false, conversion: false, totalExpenses: false, none: true });
      } else {
        // If None is unchecked, keep current state but set none to false
        onChecksChange({ ...checks, none: false });
      }
    } else {
      // For any metric checkbox
      const newChecks = { ...checks, [metric]: checked };
      
      // If any metric is checked, uncheck None
      if (checked) {
        newChecks.none = false;
      } else {
        // If this was the last checked metric, check None
        const hasAnyMetric = newChecks.spend || newChecks.profit || newChecks.orders || newChecks.clicks || newChecks.conversion || newChecks.totalExpenses;
        if (!hasAnyMetric) {
          newChecks.none = true;
        }
      }
      
      onChecksChange(newChecks);
    }
  };

  const items: MenuProps['items'] = [
    { key: 'spend', label: <Checkbox checked={checks.spend} onChange={e => { e.stopPropagation(); handleMetricChange('spend', e.target.checked); }}>Spend</Checkbox> },
    { key: 'profit', label: <Checkbox checked={checks.profit} onChange={e => { e.stopPropagation(); handleMetricChange('profit', e.target.checked); }}>Profit</Checkbox> },
    { key: 'orders', label: <Checkbox checked={checks.orders} onChange={e => { e.stopPropagation(); handleMetricChange('orders', e.target.checked); }}>Units</Checkbox> },
    { key: 'clicks', label: <Checkbox checked={checks.clicks} onChange={e => { e.stopPropagation(); handleMetricChange('clicks', e.target.checked); }}>Clicks</Checkbox> },
    { key: 'conversion', label: <Checkbox checked={checks.conversion} onChange={e => { e.stopPropagation(); handleMetricChange('conversion', e.target.checked); }}>Conversion</Checkbox> },
    { key: 'totalExpenses', label: <Checkbox checked={checks.totalExpenses} onChange={e => { e.stopPropagation(); handleMetricChange('totalExpenses', e.target.checked); }}>Total expenses</Checkbox> },
    { key: 'none', label: <Checkbox checked={checks.none} onChange={e => { e.stopPropagation(); handleMetricChange('none', e.target.checked); }}>None</Checkbox> },
  ];

  if (collapsed) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {chartId === 'main' ? 'Main Chart' : `Chart #${chartId.split('-')[1]}`}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Dropdown 
            open={dropOpen} 
            onOpenChange={setDropOpen} 
            trigger={['click']}
            popupRender={() => (
              <div style={{ 
                background: '#fff', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px', 
                boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                padding: '4px 0',
                minWidth: '120px'
              }}>
                {items.map((item) => (
                  <div key={item?.key} style={{ padding: '4px 12px' }}>
                    {item && 'label' in item ? item.label : null}
                  </div>
                ))}
              </div>
            )}
          >
            <Button>⚙️ <DownOutlined /></Button>
          </Dropdown>
          {chartId !== 'main' && onDelete && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={onDelete}
              title="Delete chart"
            />
          )}
        </div>
      </div>
      <div style={{ height: 400, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
}


type ChartPreset = {
  name: string;
  charts: Array<{
    id: string;
    checks: { 
      spend: boolean; 
      profit: boolean; 
      orders: boolean; 
      clicks: boolean; 
      conversion: boolean; 
      totalExpenses: boolean;
      none: boolean 
    };
  }>;
  rowChartIds: string[];
  columnChartIds: string[];
  timestamp: number;
};

function ChartsBlock({ dateRange, axisType }: { dateRange: [Dayjs, Dayjs] | null; axisType: 'day' | 'week' | 'month' }) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('chartsCollapsed') || 'false'); } catch { return false; }
  });
  const [charts, setCharts] = React.useState<Array<{
    id: string;
    checks: { 
      spend: boolean; 
      profit: boolean; 
      orders: boolean; 
      clicks: boolean; 
      conversion: boolean; 
      totalExpenses: boolean;
      none: boolean 
    };
  }>>(() => {
    try { 
      const saved = localStorage.getItem('charts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'main',
        checks: { 
          spend: true, 
          profit: true, 
          orders: true, 
          clicks: true, 
          conversion: true, 
          totalExpenses: true,
          none: false 
        }
      }
    ];
  });

  // Layout state: pin main in the row, others can be in row (right of main) or in column (below main)
  const [rowChartIds, setRowChartIds] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rowChartIds') || '["main"]'); } catch { return ['main']; }
  });
  const [columnChartIds, setColumnChartIds] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('columnChartIds') || '[]'); } catch { return []; }
  });
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  // Presets state
  const [presets, setPresets] = React.useState<ChartPreset[]>(() => {
    try { return JSON.parse(localStorage.getItem('chartPresets') || '[]'); } catch { return []; }
  });
  const [presetsOpen, setPresetsOpen] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState('');

  React.useEffect(() => {
    const onStorage = () => {
      try { setCollapsed(JSON.parse(localStorage.getItem('chartsCollapsed') || 'false')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  React.useEffect(() => {
    try { localStorage.setItem('chartsCollapsed', JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  // Save charts state
  React.useEffect(() => {
    try { localStorage.setItem('charts', JSON.stringify(charts)); } catch {}
  }, [charts]);

  React.useEffect(() => {
    try { localStorage.setItem('rowChartIds', JSON.stringify(rowChartIds)); } catch {}
  }, [rowChartIds]);

  React.useEffect(() => {
    try { localStorage.setItem('columnChartIds', JSON.stringify(columnChartIds)); } catch {}
  }, [columnChartIds]);

  const addChart = () => {
    // Find the next chart number
    const existingCharts = charts.filter(chart => chart.id !== 'main');
    const nextChartNumber = existingCharts.length + 2; // +2 because we start from Chart #2
    const newChartId = `chart-${nextChartNumber}`;
    const mainChart = charts.find(chart => chart.id === 'main');
    const newChart = {
      id: newChartId,
      checks: mainChart ? { ...mainChart.checks } : { 
        spend: true, 
        profit: true, 
        orders: true, 
        clicks: true, 
        conversion: true, 
        totalExpenses: true,
        none: false 
      }
    };
    setCharts(prev => [...prev, newChart]);
    // By default, new chart goes to the column below main
    setColumnChartIds(prev => [...prev, newChartId]);
  };

  const deleteChart = (chartId: string) => {
    if (chartId === 'main') return; // Нельзя удалить основной график
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
    setRowChartIds(prev => prev.filter(id => id !== chartId));
    setColumnChartIds(prev => prev.filter(id => id !== chartId));
  };

  // Keep layout lists in sync with charts list; ensure main stays in row
  React.useEffect(() => {
    setRowChartIds(prev => {
      const existingIds = new Set(charts.map(c => c.id));
      const next = prev.filter(id => existingIds.has(id));
      if (!next.includes('main')) next.unshift('main');
      // De-duplicate
      return Array.from(new Set(next));
    });
    setColumnChartIds(prev => {
      const existingIds = new Set(charts.map(c => c.id));
      // remove non-existing and main from column
      const cleaned = prev.filter(id => existingIds.has(id) && id !== 'main');
      const alreadyPlaced = new Set([...rowChartIds, ...cleaned]);
      const missing = charts.map(c => c.id).filter(id => id !== 'main' && !alreadyPlaced.has(id));
      return [...cleaned, ...missing];
    });
  }, [charts]);

  // Drag handlers (HTML5 DnD)
  const handleChartDragStart = (id: string) => (e: React.DragEvent) => {
    if (id === 'main') return;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleChartDragEnd = () => setDraggingId(null);

  const canDropToRow = React.useMemo(() => {
    return !!draggingId && columnChartIds.includes(draggingId) && rowChartIds.length < 3;
  }, [draggingId, columnChartIds, rowChartIds.length]);
  const canDropToColumn = React.useMemo(() => {
    return !!draggingId && rowChartIds.includes(draggingId) && draggingId !== 'main';
  }, [draggingId, rowChartIds]);

  const onDropToRow = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || !canDropToRow) return;
    setColumnChartIds(prev => prev.filter(id => id !== draggingId));
    setRowChartIds(prev => [...prev, draggingId]);
    setDraggingId(null);
  };
  const onDropToColumn = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId || !canDropToColumn) return;
    setRowChartIds(prev => prev.filter(id => id !== draggingId));
    // place just below main (top of column)
    setColumnChartIds(prev => [draggingId, ...prev]);
    setDraggingId(null);
  };

  const updateChartChecks = (chartId: string, nextChecks: { 
    spend: boolean; profit: boolean; orders: boolean; clicks: boolean; conversion: boolean; totalExpenses: boolean; none: boolean 
  }) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, checks: nextChecks } : c));
  };

  // Preset functions
  const savePreset = () => {
    if (!newPresetName.trim()) return;
    
    const preset: ChartPreset = {
      name: newPresetName.trim(),
      charts: [...charts],
      rowChartIds: [...rowChartIds],
      columnChartIds: [...columnChartIds],
      timestamp: Date.now()
    };
    
    const newPresets = [...presets, preset];
    setPresets(newPresets);
    localStorage.setItem('chartPresets', JSON.stringify(newPresets));
    setNewPresetName('');
    setPresetsOpen(false);
  };

  const applyPreset = (preset: ChartPreset) => {
    setCharts([...preset.charts]);
    setRowChartIds([...preset.rowChartIds]);
    setColumnChartIds([...preset.columnChartIds]);
    setPresetsOpen(false);
  };

  const deletePreset = (presetName: string) => {
    const newPresets = presets.filter(p => p.name !== presetName);
    setPresets(newPresets);
    localStorage.setItem('chartPresets', JSON.stringify(newPresets));
  };

  const resetToDefault = () => {
    const defaultCharts = [{
      id: 'main',
      checks: { 
        spend: true, 
        profit: true, 
        orders: true, 
        clicks: true, 
        conversion: true, 
        totalExpenses: true,
        none: false 
      }
    }];
    setCharts(defaultCharts);
    setRowChartIds(['main']);
    setColumnChartIds([]);
    setPresetsOpen(false);
  };

  return (
    <Card
      title="Charts"
      style={{ maxWidth: 1600, margin: '0 auto' }}
      styles={{ body: collapsed ? { display: 'none', padding: 0 } : undefined }}
      extra={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!collapsed && (
            <Dropdown
              open={presetsOpen}
              onOpenChange={setPresetsOpen}
              popupRender={() => (
                <div style={{ 
                  background: '#fff', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                  padding: '8px',
                  minWidth: '280px'
                }}>
                  
                  <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                      <Button type="link" style={{ padding: 0 }} onClick={resetToDefault}>
                        Reset to Default
                      </Button>
                    </div>
                    
                    {presets.length === 0 && (
                      <Typography.Text type="secondary" style={{ display: 'block', padding: '6px 4px' }}>
                        No presets saved
                      </Typography.Text>
                    )}
                    
                    {presets.map((preset, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                        <Button 
                          type="link" 
                          style={{ padding: 0 }} 
                          onClick={() => applyPreset(preset)}
                        >
                          {preset.name}
                        </Button>
                        <Button 
                          size="small" 
                          danger 
                          onClick={() => deletePreset(preset.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input 
                      placeholder="New preset name" 
                      value={newPresetName} 
                      onChange={e => setNewPresetName(e.target.value)}
                      onPressEnter={savePreset}
                    />
                    <Button onClick={savePreset}>+</Button>
                  </div>
                </div>
              )}
            >
              <Button>Chart Presets <DownOutlined /></Button>
            </Dropdown>
          )}
          <Button type="text" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? <DownOutlined /> : <UpOutlined />}
          </Button>
        </div>
      }
    >
      {!collapsed && (
        <>
        {/* Row with main and up to two others (max 3 total), equal widths */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
        {rowChartIds.map((id) => {
          const ch = charts.find(c => c.id === id);
          if (!ch) return null;
          const widthPercent = 100 / Math.max(1, rowChartIds.length);
          return (
            <div
              key={id}
              style={{ flex: `0 0 ${widthPercent}%`, maxWidth: `${widthPercent}%` }}
              draggable={id !== 'main'}
              onDragStart={handleChartDragStart(id)}
              onDragEnd={handleChartDragEnd}
            >
              <UnifiedChart 
                dateRange={dateRange} 
                collapsed={collapsed} 
                chartId={id}
                checks={ch.checks}
                onChecksChange={(next) => updateChartChecks(id, next)}
                onDelete={id !== 'main' ? () => deleteChart(id) : undefined}
                axisType={axisType}
              />
            </div>
          );
        })}
        {/* Right-of-main drop zone (only when dragging from column and there's space) */}
        {canDropToRow && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropToRow}
            style={{
              flex: `0 0 ${100 / (rowChartIds.length + 1)}%`,
              maxWidth: `${100 / (rowChartIds.length + 1)}%`,
              border: '2px dashed #1890ff',
              borderRadius: 8,
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1890ff'
            }}
          >
            Drop here
          </div>
        )}
      </div>

      {/* Below-main drop zone (only when dragging from row, excluding main) */}
      {canDropToColumn && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropToColumn}
          style={{
            border: '2px dashed #1890ff',
            borderRadius: 8,
            minHeight: 60,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1890ff'
          }}
        >
          Drop below main
        </div>
      )}

      {/* Column below main: each chart full width */}
      {columnChartIds.map((id) => {
        const ch = charts.find(c => c.id === id);
        if (!ch) return null;
        return (
          <div
            key={id}
            draggable
            onDragStart={handleChartDragStart(id)}
            onDragEnd={handleChartDragEnd}
          >
            <UnifiedChart 
              dateRange={dateRange} 
              collapsed={collapsed} 
              chartId={id}
              checks={ch.checks}
              onChecksChange={(next) => updateChartChecks(id, next)}
              onDelete={() => deleteChart(id)}
              axisType={axisType}
            />
          </div>
        );
      })}

          {/* Add chart button (visible when not collapsed) - moved to bottom */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Button 
              type="dashed" 
              icon={<PlusCircleOutlined />}
              onClick={addChart}
              style={{ borderStyle: 'dashed', borderColor: '#d9d9d9' }}
            >
              Add Chart
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

type Row = {
  key: string;
  img: string;
  product: string;
  asin: string;
  blogger?: string;
  orders: number;
  clicks: number;
  conversion: number;
  rate: number;
  margin: number;
  spend: number;
  sales: number;
  profit: number;
  promoCosts: number;
  totalExpenses: number;
};

const extractAsin = (product: string) => product.split(' ')[0];

// Function to extract product data
const extractProductData = (product: string) => {
  const asinMatch = product.match(/^(B[A-Z0-9]{9})/);
  const asin = asinMatch ? asinMatch[1] : '';
  
  const skuMatch = product.match(/\(SKU:\s*([^)]+)\)/);
  const sku = skuMatch ? skuMatch[1] : '';
  
  const nameMatch = product.match(/\)\s*(.+)$/);
  const name = nameMatch ? nameMatch[1] : product;
  
  return { asin, sku, name };
};

const detailsRowsBase: Row[] = [
  { key:'1', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'B08RXT2YVL (SKU: HVM-70001) Stainless Steel Toilet Brush and Holder – Matte Black', asin: 'B08RXT2YVL', blogger:'Иван Иванов', orders:5, clicks:120, conversion:4.2, rate:7, margin:15, spend:45.50, sales:89.20, profit:13.38, promoCosts: 12.50, totalExpenses: 58.00 },
  { key:'2', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0BBB22222 (SKU: HVM-70002) 720° Rotating Faucet Aerator – Splash-proof Smart Filter', asin: 'B0BBB22222', blogger:'Мария Смирнова', orders:8, clicks:95, conversion:8.4, rate:7, margin:53, spend:32.80, sales:126.40, profit:67.00, promoCosts: 18.20, totalExpenses: 51.00 },
  { key:'3', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKprCjvW5CbqPRI9Qt8DIHJVztC4FlWkoSfg&s', product:'B0CCC33333 (SKU: HVM-70003) Gold Toilet Brush and Holder – Brushed Stainless Steel', asin: 'B0CCC33333', blogger:'Иван Иванов', orders:12, clicks:180, conversion:6.7, rate:7, margin:53, spend:67.50, sales:252.80, profit:134.00, promoCosts: 25.00, totalExpenses: 92.50 },
  { key:'4', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLGQ3xRxuRsEnru3EiWdylLg7GVaEESV8Yg&s', product:'B0DDD44444 (SKU: HVM-70004) Gold Toilet Brush and Holder – Deluxe Edition', asin: 'B0DDD44444', blogger:'Мария Смирнова', orders:6, clicks:75, conversion:8.0, rate:7, margin:53, spend:28.40, sales:126.40, profit:67.00, promoCosts: 15.00, totalExpenses: 43.40 },
  // Добавляем строки для Shopify (который есть в фильтрах, но отсутствует в таблицах)
  { key:'5', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'B0EEE55555 (SKU: HVM-70005) Premium Kitchen Faucet Filter – Advanced Filtration', asin: 'B0EEE55555', blogger:'Иван Иванов', orders:15, clicks:220, conversion:6.8, rate:7, margin:53, spend:89.20, sales:379.20, profit:201.00, promoCosts: 35.00, totalExpenses: 124.20 },
  { key:'6', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0FFF66666 (SKU: HVM-70006) Smart Water Filter System – Multi-Stage Purification', asin: 'B0FFF66666', blogger:'Мария Смирнова', orders:9, clicks:140, conversion:6.4, rate:7, margin:53, spend:52.80, sales:252.80, profit:134.00, promoCosts: 22.50, totalExpenses: 75.30 },
  // Добавляем больше данных для лучшего тестирования
  { key:'7', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'B0GGG77777 (SKU: HVM-70007) Advanced Water Purifier – 5-Stage Filtration', asin: 'B0GGG77777', blogger:'Иван Иванов', orders:20, clicks:300, conversion:6.7, rate:7, margin:53, spend:125.00, sales:505.60, profit:268.00, promoCosts: 50.00, totalExpenses: 175.00 },
  { key:'8', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0HHH88888 (SKU: HVM-70008) Compact Faucet Filter – Easy Installation', asin: 'B0HHH88888', blogger:'Мария Смирнова', orders:7, clicks:110, conversion:6.4, rate:7, margin:53, spend:41.20, sales:189.60, profit:100.50, promoCosts: 17.50, totalExpenses: 58.70 },
];

// Initialize asinOptions now that detailsRowsBase is known
asinOptions = Array.from(new Set(detailsRowsBase.map(r => r.asin))).map(a => ({ value: a, label: a }));

// Create dynamic options from table data

const getBloggerOptions = () => {
  const bloggers = new Set<string>();
  // Add bloggers from bloggerOptions
  bloggerOptions.forEach(b => bloggers.add(b.value));
  // Add bloggers from detailsRowsBase
  detailsRowsBase.forEach(r => r.blogger && bloggers.add(r.blogger));
  return Array.from(bloggers).map(b => ({ value: b, label: b }));
};

const getAsinOptions = () => {
  const asins = new Set<string>();
  // Add asins from detailsRowsBase
  detailsRowsBase.forEach(r => asins.add(r.asin));
  return Array.from(asins).map(a => ({ value: a, label: a }));
};

// Content table data for link options
const contentRowsBase: ContentRow[] = [
  { key: 'c1', asin: 'B08RXT2YVL', blogger: 'Иван Иванов', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), campaign: 'Amazon', link: 'https://youtube.com/watch?v=abc123' },
  { key: 'c2', asin: 'B0BBB22222', blogger: 'Мария Смирнова', date: dayjs().format('YYYY-MM-DD'), campaign: 'eBay', link: 'https://instagram.com/p/xyz789' },
  { key: 'c3', asin: 'B0CCC33333', blogger: 'Иван Иванов', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), campaign: 'Amazon', link: 'https://youtube.com/watch?v=def456' },
  { key: 'c4', asin: 'B0DDD44444', blogger: 'Мария Смирнова', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), campaign: 'eBay', link: 'https://instagram.com/p/ghi789' },
  { key: 'c5', asin: 'B0EEE55555', blogger: 'Иван Иванов', date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), campaign: 'Shopify', link: 'https://youtube.com/watch?v=jkl012' },
  { key: 'c6', asin: 'B0FFF66666', blogger: 'Мария Смирнова', date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), campaign: 'Shopify', link: 'https://instagram.com/p/mno345' },
  // Добавляем больше данных для лучшего тестирования
  { key: 'c7', asin: 'B0GGG77777', blogger: 'Иван Иванов', date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), campaign: 'Amazon', link: 'https://youtube.com/watch?v=pqr678' },
  { key: 'c8', asin: 'B0HHH88888', blogger: 'Мария Смирнова', date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), campaign: 'eBay', link: 'https://instagram.com/p/stu901' },
  { key: 'c9', asin: 'B08RXT2YVL', blogger: 'Иван Иванов', date: dayjs().subtract(8, 'day').format('YYYY-MM-DD'), campaign: 'Amazon', link: 'https://youtube.com/watch?v=vwx234' },
  { key: 'c10', asin: 'B0BBB22222', blogger: 'Мария Смирнова', date: dayjs().subtract(9, 'day').format('YYYY-MM-DD'), campaign: 'eBay', link: 'https://instagram.com/p/yza567' },
  { key: 'c11', asin: 'B0CCC33333', blogger: 'Иван Иванов', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), campaign: 'Shopify', link: 'https://youtube.com/watch?v=bcd890' },
  { key: 'c12', asin: 'B0DDD44444', blogger: 'Мария Смирнова', date: dayjs().subtract(11, 'day').format('YYYY-MM-DD'), campaign: 'Shopify', link: 'https://instagram.com/p/efg123' },
];

const getLinkOptions = () => {
  const links = new Set<string>();
  // Add links from contentRowsBase
  contentRowsBase.forEach(r => links.add(r.link));
  return Array.from(links).map(l => ({ value: l, label: l }));
};

// Function to calculate metrics based on filters
function calculateMetrics(
  filters: { 
    company?: string; 
    blogger?: string; 
    asin?: string; 
    link?: string 
  }, 
  dateRange: [Dayjs, Dayjs] | null
) {
  // Filter detailsRowsBase based on current filters
  let filteredDetails = detailsRowsBase.filter(row => {
    // Apply company filter (campaign filter)
    if (filters.company) {
      // Find matching content rows for this ASIN to get campaign info
      const contentRow = contentRowsBase.find(cr => cr.asin === row.asin);
      if (!contentRow || contentRow.campaign !== filters.company) {
        return false;
      }
    }
    
    // Apply blogger filter
    if (filters.blogger && row.blogger !== filters.blogger) {
      return false;
    }
    
    // Apply ASIN filter
    if (filters.asin && row.asin !== filters.asin) {
      return false;
    }
    
    // Apply link filter (if specified)
    if (filters.link) {
      const contentRow = contentRowsBase.find(cr => cr.asin === row.asin);
      if (!contentRow || contentRow.link !== filters.link) {
        return false;
      }
    }
    
    return true;
  });
  
  // Filter contentRowsBase for date range
  let filteredContent = contentRowsBase.filter(row => {
    if (!dateRange) return true;
    
    const rowDate = dayjs(row.date).startOf('day');
    const [start, end] = dateRange;
    return rowDate.isAfter(start.startOf('day').subtract(1, 'day')) && 
           rowDate.isBefore(end.endOf('day').add(1, 'day'));
  });
  
  // Apply content filters to details
  if (dateRange || filters.company || filters.link) {
    const validAsins = new Set(filteredContent.map(cr => cr.asin));
    filteredDetails = filteredDetails.filter(dr => validAsins.has(dr.asin));
  }
  
  // Calculate current metrics
  const currentMetrics = {
    Spend: filteredDetails.reduce((sum, row) => sum + row.spend, 0),
    Clicks: filteredDetails.reduce((sum, row) => sum + row.clicks, 0),
    Units: filteredDetails.reduce((sum, row) => sum + row.orders, 0),
    Sales: filteredDetails.reduce((sum, row) => sum + row.sales, 0),
    Conversion: filteredDetails.length > 0 ? 
      (filteredDetails.reduce((sum, row) => sum + row.orders, 0) / 
       Math.max(filteredDetails.reduce((sum, row) => sum + row.clicks, 0), 1) * 100).toFixed(1) + '%' : '0%',
    'Commision Rate': filteredDetails.length > 0 ? 
      (filteredDetails.reduce((sum, row) => sum + row.rate, 0) / filteredDetails.length).toFixed(1) + '%' : '0%',
    Profit: filteredDetails.reduce((sum, row) => sum + row.profit, 0),
    'Promotional Costs': filteredDetails.reduce((sum, row) => sum + row.promoCosts, 0),
    'Total expenses': filteredDetails.reduce((sum, row) => sum + row.totalExpenses, 0)
  };
  
  // Calculate previous period metrics (for comparison)
  // For demo purposes, we'll use a simple calculation based on current data
  const previousMetrics = {
    Spend: currentMetrics.Spend * 0.6, // Simulate 40% increase
    Clicks: Math.round(currentMetrics.Clicks * 0.7), // Simulate 30% increase
    Units: Math.round(currentMetrics.Units * 0.8), // Simulate 20% increase
    Sales: currentMetrics.Sales * 0.6, // Simulate 40% increase
    Conversion: currentMetrics.Conversion === '0%' ? '0%' : 
      (parseFloat(currentMetrics.Conversion.replace('%', '')) * 0.8).toFixed(1) + '%',
    'Commision Rate': currentMetrics['Commision Rate'] === '0%' ? '0%' : 
      (parseFloat(currentMetrics['Commision Rate'].replace('%', '')) * 0.7).toFixed(1) + '%',
    Profit: currentMetrics.Profit * 0.6, // Simulate 40% increase
    'Promotional Costs': currentMetrics['Promotional Costs'] * 0.6,
    'Total expenses': currentMetrics['Total expenses'] * 0.6
  };
  
  return { current: currentMetrics, previous: previousMetrics };
}

function TruncatedText({ text, style }: { text: string; style: React.CSSProperties }) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const textRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  const content = (
    <span ref={textRef} style={style}>
      {text}
    </span>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft" trigger={["hover","focus"]}>
      {content}
    </Tooltip>
  ) : content;
}

function ProductNameTooltip({ text, style }: { text: string; style: React.CSSProperties }) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  // Recalculate when column width changes (user resizes) using ResizeObserver
  React.useEffect(() => {
    const el = textRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    });
    ro.observe(el);
    return () => {
      try { ro.disconnect(); } catch {}
    };
  }, []);

  const defaultStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    ...style
  };

  const content = (
    <div ref={textRef} style={defaultStyle} tabIndex={isOverflowing ? 0 : -1}>
      {text}
    </div>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft" trigger={["hover","focus"]}>
      {content}
    </Tooltip>
  ) : content;
}

function TruncatedTextWithTooltip({ 
  text, 
  style 
}: { 
  text: string; 
  style?: React.CSSProperties;
}) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  // Recalculate overflow on element resize (e.g., when user resizes column)
  React.useEffect(() => {
    const el = textRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    });
    ro.observe(el);
    return () => {
      try { ro.disconnect(); } catch {}
    };
  }, []);

  const defaultStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    ...style
  };

  const content = (
    <div ref={textRef} style={defaultStyle} tabIndex={isOverflowing ? 0 : -1}>
      {text}
    </div>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft">
      {content}
    </Tooltip>
  ) : content;
}

function TruncatedLinkWithTooltip({ 
  href, 
  text, 
  style 
}: { 
  href: string; 
  text: string; 
  style?: React.CSSProperties;
}) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const linkRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    if (linkRef.current) {
      setIsOverflowing(linkRef.current.scrollWidth > linkRef.current.clientWidth);
    }
  }, [text]);

  React.useEffect(() => {
    const el = linkRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    });
    ro.observe(el);
    return () => {
      try { ro.disconnect(); } catch {}
    };
  }, []);

  const defaultStyle: React.CSSProperties = {
    color: '#1890ff', 
    textDecoration: 'none',
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    display: 'block',
    ...style
  };

  const linkElement = (
    <a 
      ref={linkRef}
      href={href} 
      target="_blank" 
      rel="noreferrer"
      style={defaultStyle}
      tabIndex={isOverflowing ? 0 : -1}
    >
      {text}
    </a>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft" trigger={["hover","focus"]}>
      {linkElement}
    </Tooltip>
  ) : linkElement;
}

function ColumnVisibilityControl({ 
  columnDefs, 
  columnVisibility,
  onColumnVisibilityChange 
}: { 
  columnDefs: any[]; 
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (colId: string, visible: boolean) => void;
}) {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(() => {
    const visible = new Set<string>();
    columnDefs.forEach(col => {
      // If columnVisibility[colId] is undefined or true, show column
      if (columnVisibility[col.colId] !== false) {
        visible.add(col.colId);
      }
    });
    return visible;
  });
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Sync visibleColumns when columnVisibility changes
  React.useEffect(() => {
    const visible = new Set<string>();
    columnDefs.forEach(col => {
      if (columnVisibility[col.colId] !== false) {
        visible.add(col.colId);
      }
    });
    setVisibleColumns(visible);
  }, [columnVisibility, columnDefs]);

  const handleColumnToggle = (colId: string, checked: boolean) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (checked) {
      newVisibleColumns.add(colId);
    } else {
      newVisibleColumns.delete(colId);
    }
    setVisibleColumns(newVisibleColumns);
    onColumnVisibilityChange(colId, checked);
  };

  const menuItems: MenuProps['items'] = columnDefs.map(col => ({
    key: col.colId,
    label: (
      <Checkbox
        onClick={e => e.stopPropagation()}
        checked={visibleColumns.has(col.colId)}
        onChange={e => handleColumnToggle(col.colId, e.target.checked)}
      >
        {col.headerName}
      </Checkbox>
    ),
  }));

  return (
    <Dropdown 
      menu={{ items: menuItems }} 
      open={dropdownOpen} 
      onOpenChange={setDropdownOpen}
      trigger={['click']}
      placement="bottomLeft"
    >
      <Button 
        type="text" 
        icon={<SettingOutlined />}
        style={{ 
          position: 'absolute',
          top: '8px',
          left: '8px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #d9d9d9',
          borderRadius: '4px'
        }}
        size="small"
      />
    </Dropdown>
  );
}

function TablePresets({ 
  tableId, 
  onPresetChange,
  onSavePreset
}: { 
  tableId: string; 
  onPresetChange: (preset: any) => void;
  onSavePreset: () => any;
}) {
  const [presets, setPresets] = React.useState<Record<string, any>>({});
  const [selectedPreset, setSelectedPreset] = React.useState<string>('');
  const [newPresetName, setNewPresetName] = React.useState('');
  const [presetsOpen, setPresetsOpen] = React.useState(false);

  React.useEffect(() => {
    const savedPresets = localStorage.getItem(`table-presets-${tableId}`);
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, [tableId]);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    
    const currentSettings = onSavePreset();
    if (!currentSettings) return;
    
    const newPresets = {
      ...presets,
      [newPresetName]: {
        name: newPresetName,
        ...currentSettings,
        timestamp: Date.now()
      }
    };
    
    setPresets(newPresets);
    localStorage.setItem(`table-presets-${tableId}`, JSON.stringify(newPresets));
    setNewPresetName('');
    setPresetsOpen(false);
  };

  const deletePreset = (presetName: string) => {
    const newPresets = { ...presets };
    delete newPresets[presetName];
    setPresets(newPresets);
    localStorage.setItem(`table-presets-${tableId}`, JSON.stringify(newPresets));
    
    if (selectedPreset === presetName) {
      setSelectedPreset('');
    }
  };

  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    onPresetChange(presets[presetName]);
    setPresetsOpen(false);
  };

  const resetToDefault = () => {
    setSelectedPreset('');
    onPresetChange(null); // Передаем null для сброса
    setPresetsOpen(false);
  };

  const presetsArray = Object.values(presets);

  return (
    <Dropdown
      open={presetsOpen}
      onOpenChange={setPresetsOpen}
      popupRender={() => (
        <div style={{ padding: 8, width: 280, background: '#ffffff', boxShadow: '0 6px 16px rgba(0,0,0,0.15)', border: '1px solid #D9D9D9', borderRadius: 8 }}>
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
              <Button type="link" style={{ padding: 0 }} onClick={resetToDefault}>Reset to Default</Button>
            </div>
            {presetsArray.length === 0 && <Typography.Text type="secondary">Нет пресетов</Typography.Text>}
            {presetsArray.map((preset: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                <Button type="link" style={{ padding: 0 }} onClick={() => applyPreset(preset.name)}>{preset.name}</Button>
                <Button size="small" danger onClick={() => deletePreset(preset.name)}>Delete</Button>
              </div>
            ))}
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="New preset name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
            <Button onClick={savePreset}>+</Button>
          </div>
        </div>
      )}
    >
      <Button>Table Presets <DownOutlined /></Button>
    </Dropdown>
  );
}

function DetailsTableCard({ filters, onShowContent }: { 
  filters: { asin?: string; blogger?: string }; 
  onShowContent: (filter: { type: 'blogger' | 'product'; value: string }) => void;
}) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('detailsCollapsed') || 'false'); } catch { return false; }
  });
  React.useEffect(() => { localStorage.setItem('detailsCollapsed', JSON.stringify(collapsed)); }, [collapsed]);

  return (
    <Card
      title="Details"
      style={{ maxWidth: 1600, margin: '0 auto' }}
      styles={{ body: collapsed ? { display: 'none', padding: 0 } : undefined }}
      extra={
        <Button type="text" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <DownOutlined /> : <UpOutlined />}
        </Button>
      }
    >
      {!collapsed && (
        <DetailsTable filters={filters} onShowContent={onShowContent} />
      )}
    </Card>
  );
}

function DetailsTable({ filters, onShowContent }: { 
  filters: { asin?: string; blogger?: string }; 
  onShowContent: (filter: { type: 'blogger' | 'product'; value: string }) => void;
}) {
  const [viewMode, setViewMode] = React.useState<'product' | 'blogger'>('product');
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('detailsColumnVisibility') || '{}'); } catch { return {}; }
  });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [tableHeight, setTableHeight] = React.useState<'20' | '100'>(() => {
    try { return JSON.parse(localStorage.getItem('detailsTableHeight') || '"20"'); } catch { return '20'; }
  });
  const gridRef = React.useRef<AgGridReact>(null);
  

  React.useEffect(() => {
    try { localStorage.setItem('detailsColumnVisibility', JSON.stringify(columnVisibility)); } catch {}
  }, [columnVisibility]);

  React.useEffect(() => {
    try { localStorage.setItem('detailsTableHeight', JSON.stringify(tableHeight)); } catch {}
  }, [tableHeight]);

  const handleColumnVisibilityChange = (colId: string, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [colId]: visible }));
    if (gridRef.current?.api) {
      gridRef.current.api.setColumnsVisible([colId], visible);
      gridRef.current.api.sizeColumnsToFit();
    }
  };

  const saveCurrentSettings = () => {
    if (!gridRef.current?.api) return;
    
    const columnState = gridRef.current.api.getColumnState();
    const visibility: Record<string, boolean> = {};
    const widths: Record<string, number> = {};
    const order: string[] = [];
    
    // Получаем порядок колонок из текущего состояния
    columnState.forEach(col => {
      if (col.colId) {
        visibility[col.colId] = !col.hide;
        if (col.width) widths[col.colId] = col.width;
        order.push(col.colId);
      }
    });
    
    // Если порядок не получен из columnState, используем columnDefs
    if (order.length === 0) {
      columnDefs.forEach((col: any) => {
        if (col.colId) {
          order.push(col.colId);
        }
      });
    }
    
    return {
      visibility,
      widths,
      order,
      timestamp: Date.now()
    };
  };

  const loadSettings = (settings: any) => {
    if (!settings || !gridRef.current?.api) return;
    
    setColumnVisibility(settings.visibility || {});
    setColumnWidths(settings.widths || {});
    setColumnOrder(settings.order || []);
    
    // Применяем настройки к таблице
    if (settings.visibility) {
      Object.entries(settings.visibility).forEach(([colId, visible]) => {
        gridRef.current?.api.setColumnsVisible([colId], visible as boolean);
      });
    }
    
    if (settings.widths) {
      Object.entries(settings.widths).forEach(([colId, width]) => {
        gridRef.current?.api.setColumnWidths([{ key: colId, newWidth: width as number }]);
      });
    }
    
    // Применяем порядок колонок
    if (settings.order && settings.order.length > 0) {
      try {
        // Используем moveColumns для изменения порядка
        const currentColumnState = gridRef.current.api.getColumnState();
        const currentOrder = currentColumnState.map(col => col.colId).filter(Boolean);
        
        // Находим колонки, которые нужно переместить
        settings.order.forEach((targetColId: string, targetIndex: number) => {
          const currentIndex = currentOrder.indexOf(targetColId);
          if (currentIndex !== -1 && currentIndex !== targetIndex) {
            // Перемещаем колонку в нужную позицию
            gridRef.current?.api.moveColumns([targetColId], targetIndex);
          }
        });
      } catch (error) {
        console.warn('Не удалось применить порядок колонок:', error);
      }
    }
    
    setTimeout(() => {
      gridRef.current?.api.sizeColumnsToFit();
    }, 100);
  };

  const handlePresetChange = (preset: any) => {
    if (preset) {
      loadSettings(preset);
    } else {
      // Сброс на дефолтные настройки
      resetToDefaultSettings();
    }
  };

  const resetToDefaultSettings = () => {
    if (!gridRef.current?.api) return;
    
    // Сбрасываем состояния
    setColumnVisibility({});
    setColumnWidths({});
    setColumnOrder([]);
    
    // Показываем все колонки
    const allColumnIds = columnDefs.map((col: any) => col.colId).filter(Boolean);
    gridRef.current.api.setColumnsVisible(allColumnIds, true);
    
    // Сбрасываем размеры колонок
    gridRef.current.api.sizeColumnsToFit();
  };

  const columnDefs = [
    {
      headerName: viewMode === 'blogger' ? 'Blogger' : 'Product',
      field: viewMode === 'blogger' ? 'blogger' : 'product',
      colId: 'productOrBlogger',
      flex: 2,
      minWidth: 300,
      pinned: 'left',
      sortable: true,
      filter: true,
      hide: columnVisibility['productOrBlogger'] === false,
      cellRenderer: (params: any) => {
        const r = params.data as Row;
        
        const handleShowContent = () => {
          const value = viewMode === 'blogger' ? (r.blogger || '') : r.product;
          const filterValue = viewMode === 'blogger' 
            ? value 
            : extractProductData(value).asin;
          
          onShowContent({
            type: viewMode === 'blogger' ? 'blogger' : 'product',
            value: filterValue
          });
        };
        
        if (viewMode === 'blogger') {
          return (
            <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '56px' }}>
              <TruncatedTextWithTooltip 
                text={r.blogger || ''}
                style={{
                  fontSize: '14px',
                  color: '#262626'
                }}
              />
              <div
                onClick={handleShowContent}
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontSize: '12px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = '0.7';
                }}
                title="Show content"
              >
                🔍
              </div>
            </div>
          );
        } else {
          const { asin, sku, name } = extractProductData(r.product);
          return (
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                padding: '4px 0',
                height: '100%',
                minHeight: '56px',
                minWidth: 0,
                position: 'relative',
                width: '100%'
              }}>
              {/* Верхняя строка - название продукта */}
              <div style={{ marginBottom: '4px', minWidth: 0 }}>
                <TruncatedTextWithTooltip 
                  text={name}
                  style={{
                    fontWeight: 500,
                    fontSize: 14,
                    color: '#262626',
                    lineHeight: '16px'
                  }}
                />
              </div>
              
              {/* Средняя и нижняя строки с фото */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                flex: 1,
                minWidth: 0
              }}>
                {/* Фото продукта */}
                <img 
                  src={r.img} 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    objectFit: 'cover', 
                    borderRadius: 4,
                    flexShrink: 0
                  }} 
                  alt="Product"
                />
                
                {/* ASIN и SKU справа от фото */}
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '32px',
                  flex: 1,
                  minWidth: 0
                }}>
                  {/* Средняя строка - ASIN */}
                  <div style={{ 
                    fontSize: 13, 
                    color: '#1890ff',
                    fontWeight: 500,
                    lineHeight: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(`https://www.amazon.com/dp/${asin}`, '_blank')}
                  title={`Open ${asin} on Amazon`}
                  >
                    {asin}
                  </div>
                  
                  {/* Нижняя строка - SKU */}
                  <div style={{ 
                    fontSize: 12, 
                    color: '#8c8c8c',
                    lineHeight: '16px'
                  }}>
                    SKU: {sku}
                  </div>
                </div>
              </div>
              
              {/* Иконка лупы в правом нижнем углу */}
              <div
                onClick={handleShowContent}
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1890ff',
                  fontSize: '12px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = '0.7';
                }}
                title="Show content"
              >
                🔍
              </div>
            </div>
          );
        }
      },
    },
    { headerName: 'Units', field: 'orders', colId: 'orders', flex: 1, minWidth: 80, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['orders'] === false },
    { headerName: 'Clicks', field: 'clicks', colId: 'clicks', flex: 1, minWidth: 80, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['clicks'] === false },
    { headerName: 'Conversion, %', field: 'conversion', colId: 'conversion', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['conversion'] === false },
    { headerName: 'Comission Rate, %', field: 'rate', colId: 'rate', flex: 1, minWidth: 120, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['rate'] === false },
    { headerName: 'Margin, %', field: 'margin', colId: 'margin', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['margin'] === false },
    { headerName: 'Spend, $', field: 'spend', colId: 'spend', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['spend'] === false },
    { headerName: 'Promotional costs, $', field: 'promoCosts', colId: 'promoCosts', flex: 1, minWidth: 140, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['promoCosts'] === false },
    { headerName: 'Sales, $', field: 'sales', colId: 'sales', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['sales'] === false },
    { headerName: 'Profit, $', field: 'profit', colId: 'profit', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['profit'] === false },
    { headerName: 'Total expenses, $', field: 'totalExpenses', colId: 'totalExpenses', flex: 1, minWidth: 120, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['totalExpenses'] === false },
  ] as any;

  const filtered = React.useMemo(() => {
    return detailsRowsBase.filter(r => {
      if (filters.asin && r.asin !== filters.asin) return false;
      if (filters.blogger && r.blogger !== filters.blogger) return false;
      return true;
    });
  }, [filters.asin, filters.blogger, viewMode]);


  return (
    <div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h4 style={{ margin: 0 }}>Details Table:</h4>
            <Radio.Group 
              size="small" 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              <Radio.Button value="product">Product</Radio.Button>
              <Radio.Button value="blogger">Blogger</Radio.Button>
            </Radio.Group>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Rows:</span>
              <Radio.Group 
                size="small" 
                value={tableHeight} 
                onChange={(e) => setTableHeight(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="20">20</Radio.Button>
                <Radio.Button value="100">100</Radio.Button>
              </Radio.Group>
            </div>
            <TablePresets 
              tableId="details" 
              onPresetChange={handlePresetChange}
              onSavePreset={saveCurrentSettings}
            />
          </div>
        </div>
        <div className="ag-theme-alpine" style={{ width: '100%', height: tableHeight === '20' ? '1340px' : '6700px', position: 'relative' }}>
          <ColumnVisibilityControl 
            columnDefs={columnDefs}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
          <style>{`
            .ag-theme-alpine .ag-header-cell:first-child .ag-header-cell-label {
              padding-left: 40px !important;
            }
            .ag-theme-alpine .ag-cell {
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
              padding: 2px 8px !important;
            }
            .ag-theme-alpine .ag-cell-wrapper {
              display: flex !important;
              align-items: center !important;
              height: 100% !important;
            }
          `}</style>
          <AgGridReact
            ref={gridRef}
            rowData={filtered}
            columnDefs={columnDefs}
            theme="legacy"
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            suppressHorizontalScroll={false}
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={false}
            rowHeight={64}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
            }}
            onGridReady={() => {
              if (gridRef.current?.api) {
                gridRef.current.api.sizeColumnsToFit();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [visibleKeys, setVisibleKeys] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('visibleKeys') || JSON.stringify(allMetrics)); } catch { return allMetrics as string[]; }
  });
  const [activeSection, setActiveSection] = React.useState<string>('filters');
  const clickActiveLockRef = React.useRef<number | null>(null);
  
  // Refs for navigation
  const filtersRef = React.useRef<HTMLDivElement>(null);
  const tilesRef = React.useRef<HTMLDivElement>(null);
  const chartsRef = React.useRef<HTMLDivElement>(null);
  const detailsRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const [tileOrder, setTileOrder] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('tileOrder') || JSON.stringify(allMetrics)); } catch { return allMetrics as string[]; }
  });
  const [tilesPresets, setTilesPresets] = React.useState<{name:string; visibleTiles:string[]; tileOrder:string[]}[]>(
    () => { try { return JSON.parse(localStorage.getItem('tilesPresets') || '[]'); } catch { return []; } }
  );
  const [newPresetName, setNewPresetName] = React.useState('');
  const [presetsOpen, setPresetsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<[Dayjs, Dayjs] | null>(() => {
    try { 
      const saved = localStorage.getItem('dateRange');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [dayjs(parsed[0]), dayjs(parsed[1])];
      }
      return null;
    } catch { return null; }
  });
  const [axisType, setAxisType] = React.useState<'day' | 'week' | 'month'>(() => {
    try { return (localStorage.getItem('axisType') as 'day' | 'week' | 'month') || 'day'; } catch { return 'day'; }
  });
  const [selectedCompany, setSelectedCompany] = React.useState<string | undefined>(() => {
    try { return localStorage.getItem('selectedCompany') || undefined; } catch { return undefined; }
  });
  const [selectedBlogger, setSelectedBlogger] = React.useState<string | undefined>(() => {
    try { return localStorage.getItem('selectedBlogger') || undefined; } catch { return undefined; }
  });
  const [selectedAsin, setSelectedAsin] = React.useState<string | undefined>(() => {
    try { return localStorage.getItem('selectedAsin') || undefined; } catch { return undefined; }
  });
  const [selectedLink, setSelectedLink] = React.useState<string | undefined>(() => {
    try { return localStorage.getItem('selectedLink') || undefined; } catch { return undefined; }
  });
  
  // Individual filter state for Content table
  const [individualFilter, setIndividualFilter] = React.useState<{ type: 'blogger' | 'product'; value: string } | null>(null);
  

  // Calculate radio button availability based on selected period
  const getAxisTypeAvailability = React.useCallback(() => {
    if (!dateRange) return { day: false, week: false, month: false };
    
    const isDefault = isDefaultPreset(dateRange);
    if (isDefault) return { day: false, week: false, month: false };
    
    const [start, end] = dateRange;
    const diffInDays = end.diff(start, 'day') + 1;
    
    return {
      day: true,
      week: diffInDays > 7,
      month: diffInDays > 31
    };
  }, [dateRange]);

  const axisAvailability = getAxisTypeAvailability();

  // Reset axis type when it becomes unavailable
  React.useEffect(() => {
    if (!axisAvailability[axisType]) {
      if (axisAvailability.day) setAxisType('day');
      else if (axisAvailability.week) setAxisType('week');
      else if (axisAvailability.month) setAxisType('month');
    }
  }, [axisAvailability, axisType]);

  // Save filters state to localStorage

  React.useEffect(() => {
    try { 
      if (selectedCompany) localStorage.setItem('selectedCompany', selectedCompany);
      else localStorage.removeItem('selectedCompany');
    } catch {}
  }, [selectedCompany]);

  React.useEffect(() => {
    try { 
      if (selectedBlogger) localStorage.setItem('selectedBlogger', selectedBlogger);
      else localStorage.removeItem('selectedBlogger');
    } catch {}
  }, [selectedBlogger]);

  React.useEffect(() => {
    try { 
      if (selectedAsin) localStorage.setItem('selectedAsin', selectedAsin);
      else localStorage.removeItem('selectedAsin');
    } catch {}
  }, [selectedAsin]);

  React.useEffect(() => {
    try { 
      if (selectedLink) localStorage.setItem('selectedLink', selectedLink);
      else localStorage.removeItem('selectedLink');
    } catch {}
  }, [selectedLink]);

  // Reset individual filter when global filters change
  React.useEffect(() => {
    if (individualFilter) {
      setIndividualFilter(null);
    }
  }, [selectedCompany, selectedBlogger, selectedAsin, selectedLink, dateRange]);

  React.useEffect(() => {
    try { 
      if (dateRange) localStorage.setItem('dateRange', JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()]));
      else localStorage.removeItem('dateRange');
    } catch {}
  }, [dateRange]);

  React.useEffect(() => {
    try { localStorage.setItem('axisType', axisType); } catch {}
  }, [axisType]);

  React.useEffect(() => {
    try { localStorage.setItem('visibleKeys', JSON.stringify(visibleKeys)); } catch {}
  }, [visibleKeys]);

  React.useEffect(() => {
    try { localStorage.setItem('tileOrder', JSON.stringify(tileOrder)); } catch {}
  }, [tileOrder]);

  const savePresets = (next: typeof tilesPresets) => {
    setTilesPresets(next);
    localStorage.setItem('tilesPresets', JSON.stringify(next));
  };

  const items: MenuProps['items'] = allMetrics.map(m => ({
    key: m as string,
    label: (
      <Checkbox
        onClick={e => e.stopPropagation()}
        checked={(visibleKeys as string[]).includes(m as string)}
        onChange={e => {
          const next = new Set(visibleKeys);
          if (e.target.checked) next.add(m as string); else next.delete(m as string);
          const nextArr = Array.from(next);
          setVisibleKeys(nextArr);
          setTileOrder(allMetrics.filter(x => next.has(x as string)) as string[]);
        }}
      >
        {m as string}
      </Checkbox>
    )
  }));

  const applyPreset = (p: {name:string; visibleTiles:string[]; tileOrder:string[]}) => {
    setVisibleKeys([...p.visibleTiles]);
    setTileOrder([...p.tileOrder]);
    setPresetsOpen(false);
  };

  // Drag-and-drop reordering for tiles
  const dragKeyRef = React.useRef<string | null>(null);
  const handleDragStart = (key: string) => (e: React.DragEvent) => {
    dragKeyRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (overKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromKey = dragKeyRef.current;
    if (!fromKey || fromKey === overKey) return;
    const current = tileOrder.filter(k => visibleKeys.includes(k));
    const fromIndex = current.indexOf(fromKey);
    const toIndex = current.indexOf(overKey);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = current.slice();
    reordered.splice(toIndex, 0, reordered.splice(fromIndex, 1)[0]);
    // merge back into full tileOrder (preserve hidden items at the end in their relative order)
    const hidden = tileOrder.filter(k => !visibleKeys.includes(k));
    setTileOrder([...reordered, ...hidden]);
  };
  const handleDragEnd = () => { dragKeyRef.current = null; };

  // Navigation functions - simplified with fixed positions
  const scrollToSection = (section: string) => {
    // Immediately update active section on click and lock scroll handler briefly
    setActiveSection(section);
    if (clickActiveLockRef.current) {
      window.clearTimeout(clickActiveLockRef.current);
    }
    // Lock for 2000ms to ensure smooth scroll animation completes
    clickActiveLockRef.current = window.setTimeout(() => {
      clickActiveLockRef.current = null;
      // Final update after lock is released
      setActiveSection(section);
    }, 2000);

    const headerOffset = 100;
    const getTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    
    switch (section) {
      case 'filters':
        if (filtersRef.current) {
          const top = Math.max(getTop(filtersRef.current) - headerOffset, 0);
          window.scrollTo({ top, behavior: 'smooth' });
        }
        break;
        
      case 'tiles':
        if (tilesRef.current) {
          const top = Math.max(getTop(tilesRef.current) - headerOffset, 0);
          window.scrollTo({ top, behavior: 'smooth' });
        }
        break;
        
      case 'charts':
        if (chartsRef.current) {
          const top = Math.max(getTop(chartsRef.current) - headerOffset, 0);
          window.scrollTo({ top, behavior: 'smooth' });
        }
        break;
        
      case 'details':
        // Always scroll to the position where Details table would be
        // This is between charts and content, regardless of showDetails state
        if (chartsRef.current) {
          const chartsTop = getTop(chartsRef.current);
          const chartsHeight = chartsRef.current.getBoundingClientRect().height;
          const top = Math.max(chartsTop + chartsHeight + 20 - headerOffset, 0);
          window.scrollTo({ top, behavior: 'smooth' });
        }
        break;
        
      case 'content':
        if (contentRef.current) {
          const top = Math.max(getTop(contentRef.current) - headerOffset, 0);
          window.scrollTo({ top, behavior: 'smooth' });
        }
        break;
    }
  };

  // Track active section on scroll - improved to avoid misclassification near boundaries
  React.useEffect(() => {
    const handleScroll = () => {
      // If user just clicked a nav button, don't override active state momentarily
      if (clickActiveLockRef.current) return;
      const sections = [
        { name: 'filters', ref: filtersRef },
        { name: 'tiles', ref: tilesRef },
        { name: 'charts', ref: chartsRef },
        { name: 'details', ref: detailsRef },
        { name: 'content', ref: contentRef }
      ];

      // Use a marker at 35% of viewport height for stable detection
      const markerY = window.scrollY + Math.round(window.innerHeight * 0.35);
      let current = 'filters';
      let currentTop = -Infinity;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const el = section.ref.current;
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= markerY && top > currentTop) {
          current = section.name;
          currentTop = top;
        }
      }

      setActiveSection(current);
    };

    // Initial call to set correct section on load
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // No dependencies - simple tracking

  return (
    <ConfigProvider theme={appTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Navigation Component */}
        <div style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {[
            { key: 'filters', label: 'Filters' },
            { key: 'tiles', label: 'Tiles' },
            { key: 'charts', label: 'Charts' },
            { key: 'details', label: 'Details' },
            { key: 'content', label: 'Content' }
          ].map((section) => (
            <div
              key={section.key}
              onClick={() => scrollToSection(section.key)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: activeSection === section.key ? '#1890ff' : '#f5f5f5',
                color: activeSection === section.key ? '#ffffff' : '#666666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: '1.2',
                transition: 'all 0.3s ease',
                border: activeSection === section.key ? '2px solid #1890ff' : '2px solid transparent',
                boxShadow: activeSection === section.key 
                  ? '0 2px 8px rgba(24, 144, 255, 0.3)' 
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.key) {
                  e.currentTarget.style.backgroundColor = '#e6f7ff';
                  e.currentTarget.style.color = '#1890ff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.key) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.color = '#666666';
                }
              }}
              title={section.label}
            >
              {section.label.split('').map((char, index) => (
                <div key={index} style={{ lineHeight: '1' }}>
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>
        <Header style={{ background: 'transparent', padding: 0 }}>
          <div style={{ maxWidth: 1614, margin: '0 auto', padding: '0 12px' }}>
            <Typography.Title level={2} style={{ margin: '24px 0 20px' }}>Dashboard</Typography.Title>
          </div>
        </Header>
        <Content>
          <div style={{ maxWidth: 1614, margin: '0 auto', padding: '0 12px' }}>
            <div ref={filtersRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Select
                style={{ minWidth: 320 }}
                options={companyOptions}
                showSearch
                allowClear
                placeholder="Campaign"
                value={selectedCompany}
                onChange={(v) => setSelectedCompany(v)}
                filterOption={(input, option) => (String(option?.value || '')).toLowerCase().includes(input.toLowerCase())}
              />
              <Select style={{ minWidth: 320 }} options={getBloggerOptions()} showSearch allowClear placeholder="Blogger" value={selectedBlogger} onChange={(v) => setSelectedBlogger(v)} />
              <Select style={{ minWidth: 180 }} options={getAsinOptions()} showSearch allowClear placeholder="ASIN" value={selectedAsin} onChange={(v) => setSelectedAsin(v)} />
              <RangePicker
                format="DD.MM.YYYY"
                presets={[
                  { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  { label: 'Yesterday', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
                  { label: 'This Week', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                  { label: 'Last Week', value: [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')] },
                  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: 'September 2025', value: [dayjs('2025-09-01').startOf('day'), dayjs('2025-09-30').endOf('day')] },
                  { label: 'Last 3 Months', value: [dayjs().subtract(3, 'month').startOf('month'), dayjs().endOf('month')] },
                ]}
                value={dateRange as any}
                onChange={(v) => setDateRange((v && v[0] && v[1]) ? [v[0], v[1]] : null)}
                renderExtraFooter={() => (
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
                    <Radio.Group 
                      size="small" 
                      value={axisType} 
                      onChange={(e) => setAxisType(e.target.value)}
                      style={{ display: 'flex', justifyContent: 'center', gap: 4 }}
                    >
                      <Radio.Button value="day" disabled={!axisAvailability.day}>
                        Day
                      </Radio.Button>
                      <Radio.Button value="week" disabled={!axisAvailability.week}>
                        Week
                      </Radio.Button>
                      <Radio.Button value="month" disabled={!axisAvailability.month}>
                        Month
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                )}
              />
              <Dropdown menu={{ items }} open={settingsOpen} onOpenChange={setSettingsOpen} trigger={["click"]}>
                <Button>⚙️ <DownOutlined /></Button>
              </Dropdown>

              <Dropdown
                open={presetsOpen}
                onOpenChange={setPresetsOpen}
                popupRender={() => (
                  <div style={{ padding: 8, width: 280, background: '#ffffff', boxShadow: '0 6px 16px rgba(0,0,0,0.15)', border: '1px solid #D9D9D9', borderRadius: 8 }}>
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                        <Button type="link" style={{ padding: 0 }} onClick={() => { setVisibleKeys(allMetrics as string[]); setTileOrder(allMetrics as string[]); setPresetsOpen(false); }}>Reset to Default</Button>
                      </div>
                      {tilesPresets.length === 0 && <Typography.Text type="secondary">Нет пресетов</Typography.Text>}
                      {tilesPresets.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                          <Button type="link" style={{ padding: 0 }} onClick={() => applyPreset(p)}>{p.name}</Button>
                          <Button size="small" danger onClick={() => {
                            const next = tilesPresets.slice();
                            next.splice(idx, 1);
                            savePresets(next);
                          }}>Delete</Button>
                        </div>
                      ))}
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input placeholder="New preset name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
                      <Button onClick={() => {
                        const name = newPresetName.trim();
                        if (!name) return;
                        const preset = { name, visibleTiles: [...visibleKeys], tileOrder: [...tileOrder] };
                        const next = [...tilesPresets, preset];
                        savePresets(next);
                        setNewPresetName('');
                        setPresetsOpen(false);
                      }}>+</Button>
                    </div>
                  </div>
                )}
              >
                <Button>Tiles Presets <DownOutlined /></Button>
              </Dropdown>

              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      label: 'Excel',
                      onClick: () => {
                        console.log('Export to Excel');
                        setDownloadOpen(false);
                      }
                    },
                    {
                      key: 'csv',
                      label: '.CSV',
                      onClick: () => {
                        console.log('Export to CSV');
                        setDownloadOpen(false);
                      }
                    }
                  ]
                }}
                open={downloadOpen}
                onOpenChange={setDownloadOpen}
                trigger={['click']}
              >
                <Button icon={<DownloadOutlined />}>Export</Button>
              </Dropdown>

            </div>

            <div ref={tilesRef} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 15,
              maxWidth: 1600,
              margin: '0 auto 24px',
              overflowX: 'auto'
            }}>
              {tileOrder.filter(k => visibleKeys.includes(k)).map(m => {
                const currentMetrics = calculateMetrics(
                  { 
                    company: selectedCompany, 
                    blogger: selectedBlogger, 
                    asin: selectedAsin, 
                    link: selectedLink 
                  }, 
                  dateRange
                );
                return (
                  <div key={m} draggable onDragStart={handleDragStart(m)} onDragOver={handleDragOver(m)} onDragEnd={handleDragEnd}>
                    <MetricCard 
                      title={m} 
                      value={(currentMetrics.current as any)[m]} 
                      prev={(currentMetrics.previous as any)[m]} 
                    />
                  </div>
                );
              })}
            </div>

            <div ref={chartsRef} style={{ position: 'relative' }}>
              <ChartsBlock dateRange={dateRange} axisType={axisType} />
              <SummaryToggle dateRange={dateRange} />
              <SummaryPanel 
                dateRange={dateRange} 
                filters={{ 
                  company: selectedCompany, 
                  blogger: selectedBlogger, 
                  asin: selectedAsin, 
                  link: selectedLink 
                }} 
              />
            </div>

            <div ref={detailsRef} style={{ marginTop: 16 }}>
              <DetailsTableCard 
                filters={{ asin: selectedAsin, blogger: selectedBlogger }} 
                onShowContent={(filter) => {
                  setIndividualFilter(filter);
                  // Scroll to Content table via unified scroll handler
                  scrollToSection('content');
                }}
              />
            </div>

            <div ref={contentRef} style={{ marginTop: 16 }}>
              <ContentTableCard
                filters={{ company: selectedCompany, blogger: selectedBlogger, asin: selectedAsin, link: selectedLink }}
                dateRange={dateRange}
                individualFilter={individualFilter}
                onClearIndividualFilter={() => setIndividualFilter(null)}
              />
            </div>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

type ContentRow = {
  key: string;
  asin: string;
  blogger: string;
  date: string; // ISO
  campaign: string;
  link: string;
};

function ContentTableCard({ 
  filters, 
  dateRange, 
  individualFilter, 
  onClearIndividualFilter 
}: { 
  filters: { company?: string; blogger?: string; asin?: string; link?: string }; 
  dateRange: [Dayjs, Dayjs] | null;
  individualFilter: { type: 'blogger' | 'product'; value: string } | null;
  onClearIndividualFilter: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('contentCollapsed') || 'false'); } catch { return false; }
  });
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('contentColumnVisibility') || '{}'); } catch { return {}; }
  });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [tableHeight, setTableHeight] = React.useState<'20' | '100'>(() => {
    try { return JSON.parse(localStorage.getItem('contentTableHeight') || '"20"'); } catch { return '20'; }
  });
  const gridRef = React.useRef<AgGridReact>(null);
  React.useEffect(() => { localStorage.setItem('contentCollapsed', JSON.stringify(collapsed)); }, [collapsed]);

  React.useEffect(() => {
    try { localStorage.setItem('contentColumnVisibility', JSON.stringify(columnVisibility)); } catch {}
  }, [columnVisibility]);

  React.useEffect(() => {
    try { localStorage.setItem('contentTableHeight', JSON.stringify(tableHeight)); } catch {}
  }, [tableHeight]);

  const allRows: ContentRow[] = React.useMemo(() => contentRowsBase, []);

  const rows = React.useMemo(() => {
    return allRows.filter(r => {
      // Apply individual filter first if it exists
      if (individualFilter) {
        if (individualFilter.type === 'blogger') {
          if (r.blogger !== individualFilter.value) return false;
        } else if (individualFilter.type === 'product') {
          if (r.asin !== individualFilter.value) return false;
        }
      } else {
        // Apply regular filters only if no individual filter
        if (filters.company && r.campaign !== filters.company) return false;
        if (filters.blogger && r.blogger !== filters.blogger) return false;
        if (filters.asin && r.asin !== filters.asin) return false;
        if (filters.link && r.link !== filters.link) return false;
      }
      
      // Date filter always applies
      if (dateRange) {
        const d = dayjs(r.date).startOf('day');
        const [s, e] = dateRange;
        if (d.isBefore(s.startOf('day')) || d.isAfter(e.endOf('day'))) return false;
      }
      return true;
    });
  }, [allRows, filters, dateRange, individualFilter]);

  const handleColumnVisibilityChange = (colId: string, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [colId]: visible }));
    if (gridRef.current?.api) {
      gridRef.current.api.setColumnsVisible([colId], visible);
      gridRef.current.api.sizeColumnsToFit();
    }
  };

  const saveCurrentSettings = () => {
    if (!gridRef.current?.api) return;
    
    const columnState = gridRef.current.api.getColumnState();
    const visibility: Record<string, boolean> = {};
    const widths: Record<string, number> = {};
    const order: string[] = [];
    
    // Получаем порядок колонок из текущего состояния
    columnState.forEach(col => {
      if (col.colId) {
        visibility[col.colId] = !col.hide;
        if (col.width) widths[col.colId] = col.width;
        order.push(col.colId);
      }
    });
    
    // Если порядок не получен из columnState, используем columnDefs
    if (order.length === 0) {
      columnDefs.forEach((col: any) => {
        if (col.colId) {
          order.push(col.colId);
        }
      });
    }
    
    return {
      visibility,
      widths,
      order,
      timestamp: Date.now()
    };
  };

  const loadSettings = (settings: any) => {
    if (!settings || !gridRef.current?.api) return;
    
    setColumnVisibility(settings.visibility || {});
    setColumnWidths(settings.widths || {});
    setColumnOrder(settings.order || []);
    
    // Применяем настройки к таблице
    if (settings.visibility) {
      Object.entries(settings.visibility).forEach(([colId, visible]) => {
        gridRef.current?.api.setColumnsVisible([colId], visible as boolean);
      });
    }
    
    if (settings.widths) {
      Object.entries(settings.widths).forEach(([colId, width]) => {
        gridRef.current?.api.setColumnWidths([{ key: colId, newWidth: width as number }]);
      });
    }
    
    // Применяем порядок колонок
    if (settings.order && settings.order.length > 0) {
      try {
        // Используем moveColumns для изменения порядка
        const currentColumnState = gridRef.current.api.getColumnState();
        const currentOrder = currentColumnState.map(col => col.colId).filter(Boolean);
        
        // Находим колонки, которые нужно переместить
        settings.order.forEach((targetColId: string, targetIndex: number) => {
          const currentIndex = currentOrder.indexOf(targetColId);
          if (currentIndex !== -1 && currentIndex !== targetIndex) {
            // Перемещаем колонку в нужную позицию
            gridRef.current?.api.moveColumns([targetColId], targetIndex);
          }
        });
      } catch (error) {
        console.warn('Не удалось применить порядок колонок:', error);
      }
    }
    
    setTimeout(() => {
      gridRef.current?.api.sizeColumnsToFit();
    }, 100);
  };

  const handlePresetChange = (preset: any) => {
    if (preset) {
      loadSettings(preset);
    } else {
      // Сброс на дефолтные настройки
      resetToDefaultSettings();
    }
  };

  const resetToDefaultSettings = () => {
    if (!gridRef.current?.api) return;
    
    // Сбрасываем состояния
    setColumnVisibility({});
    setColumnWidths({});
    setColumnOrder([]);
    
    // Показываем все колонки
    const allColumnIds = columnDefs.map((col: any) => col.colId).filter(Boolean);
    gridRef.current.api.setColumnsVisible(allColumnIds, true);
    
    // Сбрасываем размеры колонок
    gridRef.current.api.sizeColumnsToFit();
  };

  const columnDefs = [
    { 
      headerName: 'ASIN', 
      field: 'asin', 
      colId: 'asin', 
      flex: 1, 
      minWidth: 100, 
      sortable: true, 
      filter: true, 
      hide: columnVisibility['asin'] === false,
      cellRenderer: (params: any) => (
        <div
          onClick={() => window.open(`https://www.amazon.com/dp/${params.value}`, '_blank')}
          style={{
            fontSize: '14px',
            color: '#1890ff',
            cursor: 'pointer'
          }}
          title={`Open ${params.value} on Amazon`}
        >
          <TruncatedTextWithTooltip 
            text={params.value || ''}
            style={{
              fontSize: '14px',
              color: '#1890ff'
            }}
          />
        </div>
      )
    },
    { 
      headerName: 'Blogger', 
      field: 'blogger', 
      colId: 'blogger', 
      flex: 1, 
      minWidth: 120, 
      sortable: true, 
      filter: true, 
      hide: columnVisibility['blogger'] === false,
      cellRenderer: (params: any) => (
        <TruncatedTextWithTooltip 
          text={params.value || ''}
          style={{
            fontSize: '14px',
            color: '#262626'
          }}
        />
      )
    },
    { 
      headerName: 'Date', 
      field: 'date', 
      colId: 'date', 
      flex: 1,
      minWidth: 100,
      sortable: true, 
      filter: 'agDateColumnFilter',
      hide: columnVisibility['date'] === false,
      valueFormatter: (params: any) => dayjs(params.value).format('DD.MM.YYYY')
    },
    { 
      headerName: 'Campaign', 
      field: 'campaign', 
      colId: 'campaign', 
      flex: 1, 
      minWidth: 100, 
      sortable: true, 
      filter: true, 
      hide: columnVisibility['campaign'] === false,
      cellRenderer: (params: any) => (
        <TruncatedTextWithTooltip 
          text={params.value || ''}
          style={{
            fontSize: '14px',
            color: '#262626'
          }}
        />
      )
    },
    { 
      headerName: 'Content link', 
      field: 'link', 
      colId: 'link', 
      flex: 2,
      minWidth: 200,
      sortable: true, 
      filter: true,
      hide: columnVisibility['link'] === false,
      cellRenderer: (params: any) => (
        <TruncatedLinkWithTooltip 
          href={params.value}
          text={params.value}
        />
      )
    },
  ] as any;

  return (
    <Card
      title="Content"
      style={{ maxWidth: 1600, margin: '0 auto' }}
      styles={{ body: collapsed ? { display: 'none', padding: 0 } : undefined }}
      extra={
        <Button type="text" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <DownOutlined /> : <UpOutlined />}
        </Button>
      }
    >
      {!collapsed && (
        <div>
          

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>Content Table:</h4>
                {individualFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Badge 
                      status="processing" 
                      text={
                        <span style={{ fontSize: '12px', color: '#1890ff' }}>
                          Filtered by {individualFilter.type}: {individualFilter.value}
                        </span>
                      } 
                    />
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={onClearIndividualFilter}
                      style={{ fontSize: '12px', padding: '0 4px', height: '20px' }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Rows:</span>
                  <Radio.Group 
                    size="small" 
                    value={tableHeight} 
                    onChange={(e) => setTableHeight(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="20">20</Radio.Button>
                    <Radio.Button value="100">100</Radio.Button>
                  </Radio.Group>
                </div>
                <TablePresets 
                  tableId="content" 
                  onPresetChange={handlePresetChange}
                  onSavePreset={saveCurrentSettings}
                />
              </div>
            </div>
            <div className="ag-theme-alpine" style={{ width: '100%', height: tableHeight === '20' ? '700px' : '3500px', position: 'relative' }}>
              <ColumnVisibilityControl 
                columnDefs={columnDefs}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
              />
              <style>{`
                .ag-theme-alpine .ag-header-cell:first-child .ag-header-cell-label {
                  padding-left: 40px !important;
                }
                .ag-theme-alpine .ag-cell {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: flex-start !important;
                }
                .ag-theme-alpine .ag-cell-wrapper {
                  display: flex !important;
                  align-items: center !important;
                  height: 100% !important;
                }
              `}</style>
              <AgGridReact
                ref={gridRef}
                rowData={rows}
                columnDefs={columnDefs}
                theme="legacy"
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                suppressHorizontalScroll={false}
                suppressColumnVirtualisation={true}
                suppressRowVirtualisation={false}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                }}
                onGridReady={() => {
                  if (gridRef.current?.api) {
                    gridRef.current.api.sizeColumnsToFit();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryToggle({ dateRange }: { dateRange: [Dayjs, Dayjs] | null }) {
  const [open, setOpen] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('summaryOpen') || 'false'); } catch { return false; }
  });
  React.useEffect(() => { localStorage.setItem('summaryOpen', JSON.stringify(open)); }, [open]);
  React.useEffect(() => {
    const onStorage = () => {
      try { setOpen(JSON.parse(localStorage.getItem('summaryOpen') || 'false')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const toggle = () => {
    try { localStorage.setItem('summaryOpen', JSON.stringify(!open)); } catch {}
    window.dispatchEvent(new StorageEvent('storage', { key: 'summaryOpen', newValue: JSON.stringify(!open) } as any));
  };
  return (
    <Button
      type="text"
      onClick={toggle}
      style={{ 
        position: 'fixed', 
        top: 'calc(50vh - 60px)',
        right: 0,
        zIndex: 50, 
        border: '1px solid #D9D9D9', 
        borderRadius: '8px 0 0 8px',
        background: open ? '#1890ff' : '#f5f5f5', 
        color: open ? '#ffffff' : '#666666',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        width: 32,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        writingMode: 'vertical-rl',
        textOrientation: 'mixed'
      }}
      aria-label="Toggle summary"
    >
      <span style={{
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        transform: 'rotate(180deg)',
        display: 'block'
      }}>
        SUMMARY
      </span>
    </Button>
  );
}

function SummaryPanel({ 
  dateRange, 
  filters 
}: { 
  dateRange: [Dayjs, Dayjs] | null;
  filters: { 
    company?: string; 
    blogger?: string; 
    asin?: string; 
    link?: string 
  };
}) {
  const [open, setOpen] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('summaryOpen') || 'false'); } catch { return false; }
  });
  React.useEffect(() => {
    const onStorage = () => {
      try { setOpen(JSON.parse(localStorage.getItem('summaryOpen') || 'false')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const periodText = React.useMemo(() => {
    if (!dateRange) return 'Период не выбран';
    const [s, e] = dateRange;
    return `${s.format('DD.MM.YYYY')} — ${e.format('DD.MM.YYYY')}`;
  }, [dateRange]);

  const fmtCurrency = (v: number) => `$${v.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}`;
  const fmtPercent = (v: number) => `${v.toFixed(1)}%`;

  // Calculate metrics based on current filters
  const currentMetrics = calculateMetrics(filters, dateRange);
  const sales = currentMetrics.current.Sales;
  const units = currentMetrics.current.Units; // using Units for demo
  const clicks = currentMetrics.current.Clicks;
  const conversion = parseFloat(String(currentMetrics.current.Conversion).replace('%', ''));
  const promoCost = (currentMetrics.current as any)['Promotional Costs'] ?? Math.round(currentMetrics.current.Spend * 0.25 * 100) / 100;
  const promoPerc = sales ? (promoCost / sales) * 100 : 0;
  const commissionPerc = parseFloat(String((currentMetrics.current as any)['Commision Rate']).replace('%', '')) || 7;
  const commissionUsd = sales * (commissionPerc / 100);
  const costPerc = 30; // demo
  const costUsd = sales * (costPerc / 100);
  const holdsPerc = 5; // demo
  const holdsUsd = sales * (holdsPerc / 100);
  const profit = currentMetrics.current.Profit;
  const totalExpenses = (currentMetrics.current as any)['Total expenses'] ?? 0;

  return (
    <div style={{ position: 'fixed', top: 'calc(50vh - 60px)', right: '32px', width: open ? 360 : 0, overflow: 'hidden', transition: 'width 0.2s ease', zIndex: 20, height: 'fit-content' }}>
      <Card styles={{ body: { padding: open ? 16 : 0, display: open ? 'block' : 'none', height: 'fit-content' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Typography.Text strong>Summary</Typography.Text>
          <Badge color="#007bff" text={<span style={{ color: '#666' }}>{periodText}</span>} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 6 }}>
          <RowLine label="Sales" value={`${fmtCurrency(sales)}`} />
          <RowLine label="Units" value={`${units}`} />
          <RowLine label="Profit" value={`${fmtCurrency(profit)}`} />
          <RowLine label="Total expenses" value={`${fmtCurrency(totalExpenses)}`} />
          <RowLine label="Promotional costs" value={`${fmtCurrency(promoCost)} / ${fmtPercent(promoPerc)}`} />
          <RowLine label="Amazon fee" value={`${fmtCurrency(holdsUsd)} / ${fmtPercent(holdsPerc)}`} />
          <RowLine label="Cost price" value={`${fmtCurrency(costUsd)} / ${fmtPercent(costPerc)}`} />
          <RowLine label="Comission rate" value={`${fmtCurrency(commissionUsd)} / ${fmtPercent(commissionPerc)}`} />
          <RowLine label="Clicks" value={`${clicks}`} />
          <RowLine label="Conversion" value={`${fmtPercent(conversion)}`} />
        </div>
      </Card>
    </div>
  );
}

function RowLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

