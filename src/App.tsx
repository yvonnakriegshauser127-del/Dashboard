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
import { DownOutlined, UpOutlined, InfoCircleOutlined, LeftCircleOutlined, RightCircleOutlined, SettingOutlined, DeleteOutlined, SaveOutlined, PlusCircleOutlined } from '@ant-design/icons';
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
const linkOptions = [
  { value: 'https://youtube.com/watch?v=abc123', label: 'https://youtube.com/watch?v=abc123' },
  { value: 'https://instagram.com/p/xyz789', label: 'https://instagram.com/p/xyz789' },
  { value: 'https://tiktok.com/@user/video/456', label: 'https://tiktok.com/@user/video/456' },
  { value: 'https://blog.example.com/post-1', label: 'https://blog.example.com/post-1' },
  { value: 'https://youtube.com/shorts/def456', label: 'https://youtube.com/shorts/def456' },
];

const prevM = { Spend:1774.18, Clicks:3249, Orders:120, Sales:8065.07, Conversion:'12%', 'Commision Rate':'5%', Profit:3200, 'Promotional Costs': 650.00 } as const;
const curM  = { Spend:3372.42, Clicks:6200, Orders:100, Sales:15450.24, Conversion:'15%', 'Commision Rate':'7%', Profit:5400, 'Promotional Costs': 980.00 } as const;
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
    title === 'Clicks' || title === 'Orders'
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

function ChartCard({ dateRange, collapsed }: { dateRange: [Dayjs, Dayjs] | null; collapsed: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [checks, setChecks] = React.useState<{ spend: boolean; profit: boolean; orders: boolean; none: boolean }>({ spend: true, profit: true, orders: true, none: false });
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    if (!dateRange) return [dayjs().format('DD.MM')];
    const [start, end] = dateRange;
    const labels: string[] = [];
    let d = start.startOf('day');
    const last = end.endOf('day');
    while (d.isBefore(last) || d.isSame(last, 'day')) {
      labels.push(d.format('DD.MM'));
      d = d.add(1, 'day');
    }
    return labels;
  }, [dateRange]);

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
    if (checks.orders) addPair('Orders', curM.Orders, '#33a02c', bothUnits ? yRightId : yLeftId, 0.3);
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
          Orders
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
            <Button>Spend/Profit/Orders <DownOutlined /></Button>
          </Dropdown>
        </Space>
      )}
      <canvas ref={canvasRef} style={{ display: collapsed ? 'none' : 'block' }} />
    </Card>
  );
}

function SecondaryChart({ dateRange }: { dateRange: [Dayjs, Dayjs] | null }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [checks, setChecks] = React.useState<{ clicks: boolean; orders: boolean; conversion: boolean; none: boolean }>({ clicks: true, orders: true, conversion: true, none: false });
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    if (!dateRange) return [dayjs().format('DD.MM')];
    const [start, end] = dateRange;
    const labels: string[] = [];
    let d = start.startOf('day');
    const last = end.endOf('day');
    while (d.isBefore(last) || d.isSame(last, 'day')) {
      labels.push(d.format('DD.MM'));
      d = d.add(1, 'day');
    }
    return labels;
  }, [dateRange]);

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
    if (checks.orders) addPair('Orders', 50, '#33a02c', hasPercent && hasCount ? yLeftId : yLeftId, 0.3);
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
          Orders
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
          <Button>Clicks/Orders/Conversion <DownOutlined /></Button>
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
  initialChecks,
  onDelete 
}: { 
  dateRange: [Dayjs, Dayjs] | null; 
  collapsed: boolean;
  chartId: string;
  initialChecks?: { 
    spend: boolean; 
    profit: boolean; 
    orders: boolean; 
    clicks: boolean; 
    conversion: boolean; 
    none: boolean 
  };
  onDelete?: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [checks, setChecks] = React.useState<{ 
    spend: boolean; 
    profit: boolean; 
    orders: boolean; 
    clicks: boolean; 
    conversion: boolean; 
    none: boolean 
  }>(initialChecks || { 
    spend: true, 
    profit: true, 
    orders: true, 
    clicks: true, 
    conversion: true, 
    none: false 
  });
  const [dropOpen, setDropOpen] = React.useState(false);

  const buildLabels = React.useCallback((): string[] => {
    if (!dateRange) return [dayjs().format('DD.MM')];
    const [start, end] = dateRange;
    const labels: string[] = [];
    let d = start.startOf('day');
    const last = end.endOf('day');
    while (d.isBefore(last) || d.isSame(last, 'day')) {
      labels.push(d.format('DD.MM'));
      d = d.add(1, 'day');
    }
    return labels;
  }, [dateRange]);

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

    const moneySelected = checks.spend || checks.profit;
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
    if (checks.orders) addPair('Orders', 15, '#fa8c16', yRightId, 0.3);
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

    const moneySelected = checks.spend || checks.profit;
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
                
                if (label === 'Spend' || label === 'Profit') {
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
              text: 'Spend & Profit ($)',
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
              text: 'Orders & Clicks',
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

  const items: MenuProps['items'] = [
    { key: 'spend', label: <Checkbox checked={checks.spend} onChange={e => setChecks(prev => ({ ...prev, spend: e.target.checked }))}>Spend</Checkbox> },
    { key: 'profit', label: <Checkbox checked={checks.profit} onChange={e => setChecks(prev => ({ ...prev, profit: e.target.checked }))}>Profit</Checkbox> },
    { key: 'orders', label: <Checkbox checked={checks.orders} onChange={e => setChecks(prev => ({ ...prev, orders: e.target.checked }))}>Orders</Checkbox> },
    { key: 'clicks', label: <Checkbox checked={checks.clicks} onChange={e => setChecks(prev => ({ ...prev, clicks: e.target.checked }))}>Clicks</Checkbox> },
    { key: 'conversion', label: <Checkbox checked={checks.conversion} onChange={e => setChecks(prev => ({ ...prev, conversion: e.target.checked }))}>Conversion</Checkbox> },
    { key: 'none', label: <Checkbox checked={checks.none} onChange={e => setChecks(prev => ({ ...prev, none: e.target.checked, spend: false, profit: false, orders: false, clicks: false, conversion: false }))}>None</Checkbox> },
  ];

  if (collapsed) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {chartId === 'main' ? 'Unified Metrics Chart' : `Chart ${chartId}`}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Dropdown menu={{ items }} open={dropOpen} onOpenChange={setDropOpen} trigger={['click']}>
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

function CollapseCharts() {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('chartsCollapsed') || 'false'); } catch { return false; }
  });
  React.useEffect(() => { localStorage.setItem('chartsCollapsed', JSON.stringify(collapsed)); }, [collapsed]);
  return (
    <Button onClick={() => setCollapsed(v => !v)}>{collapsed ? 'Expand charts' : 'Collapse charts'}</Button>
  );
}

function ChartsBlock({ dateRange }: { dateRange: [Dayjs, Dayjs] | null }) {
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
      none: boolean 
    };
  }>>([
    {
      id: 'main',
      checks: { 
        spend: true, 
        profit: true, 
        orders: true, 
        clicks: true, 
        conversion: true, 
        none: false 
      }
    }
  ]);

  React.useEffect(() => {
    const onStorage = () => {
      try { setCollapsed(JSON.parse(localStorage.getItem('chartsCollapsed') || 'false')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addChart = () => {
    const newChartId = `chart-${Date.now()}`;
    const mainChart = charts.find(chart => chart.id === 'main');
    const newChart = {
      id: newChartId,
      checks: mainChart ? { ...mainChart.checks } : { 
        spend: true, 
        profit: true, 
        orders: true, 
        clicks: true, 
        conversion: true, 
        none: false 
      }
    };
    setCharts(prev => [...prev, newChart]);
  };

  const deleteChart = (chartId: string) => {
    if (chartId === 'main') return; // Нельзя удалить основной график
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  return (
    <>
      {charts.map((chart, index) => (
        <div key={chart.id}>
          <UnifiedChart 
            dateRange={dateRange} 
            collapsed={collapsed} 
            chartId={chart.id}
            initialChecks={chart.checks}
            onDelete={chart.id !== 'main' ? () => deleteChart(chart.id) : undefined}
          />
          {index === 0 && !collapsed && (
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
          )}
        </div>
      ))}
    </>
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
  { key:'1', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'B0AAA11111 (SKU: HVM-70001) Stainless Steel Toilet Brush and Holder – Matte Black', asin: 'B0AAA11111', blogger:'Иван Иванов', orders:0, clicks:0, conversion:0, rate:7, margin:15, spend:0, sales:0, profit:0, promoCosts: 0 },
  { key:'2', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0BBB22222 (SKU: HVM-70002) 720° Rotating Faucet Aerator – Splash-proof Smart Filter', asin: 'B0BBB22222', blogger:'Мария Смирнова', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72, promoCosts: 2.50 },
  { key:'3', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKprCjvW5CbqPRI9Qt8DIHJVztC4FlWkoSfg&s', product:'B0CCC33333 (SKU: HVM-70003) Gold Toilet Brush and Holder – Brushed Stainless Steel', asin: 'B0CCC33333', blogger:'Иван Иванов', orders:2, clicks:30, conversion:6.7, rate:7, margin:53, spend:0, sales:25.28, profit:13.44, promoCosts: 5.00 },
  { key:'4', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLGQ3xRxuRsEnru3EiWdylLg7GVaEESV8Yg&s', product:'B0DDD44444 (SKU: HVM-70004) Gold Toilet Brush and Holder – Deluxe Edition', asin: 'B0DDD44444', blogger:'Мария Смирнова', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72, promoCosts: 2.50 },
];

// Initialize asinOptions now that detailsRowsBase is known
asinOptions = Array.from(new Set(detailsRowsBase.map(r => r.asin))).map(a => ({ value: a, label: a }));

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
    <Tooltip title={text} placement="topLeft">
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

  const defaultStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    ...style
  };

  const content = (
    <div ref={textRef} style={defaultStyle}>
      {text}
    </div>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft">
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

  const defaultStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    ...style
  };

  const content = (
    <div ref={textRef} style={defaultStyle}>
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
    >
      {text}
    </a>
  );

  return isOverflowing ? (
    <Tooltip title={text} placement="topLeft">
      {linkElement}
    </Tooltip>
  ) : linkElement;
}

function ColumnVisibilityControl({ 
  columnDefs, 
  onColumnVisibilityChange 
}: { 
  columnDefs: any[]; 
  onColumnVisibilityChange: (colId: string, visible: boolean) => void;
}) {
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    new Set(columnDefs.map(col => col.colId))
  );
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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
          <Typography.Text strong>Пресеты таблицы</Typography.Text>
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
              <Button type="link" style={{ padding: 0 }} onClick={resetToDefault}>Сбросить</Button>
            </div>
            {presetsArray.length === 0 && <Typography.Text type="secondary">Нет пресетов</Typography.Text>}
            {presetsArray.map((preset: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                <Button type="link" style={{ padding: 0 }} onClick={() => applyPreset(preset.name)}>{preset.name}</Button>
                <Button size="small" danger onClick={() => deletePreset(preset.name)}>Удалить</Button>
              </div>
            ))}
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="Название нового пресета" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
            <Button onClick={savePreset}>+</Button>
          </div>
        </div>
      )}
    >
      <Button>Presets <DownOutlined /></Button>
    </Dropdown>
  );
}

function DetailsTable({ filters }: { filters: { asin?: string; blogger?: string } }) {
  const [viewMode, setViewMode] = React.useState<'product' | 'blogger'>('product');
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const gridRef = React.useRef<AgGridReact>(null);

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
        if (viewMode === 'blogger') {
          return (
            <TruncatedTextWithTooltip 
              text={r.blogger || ''}
              style={{
                fontSize: '14px',
                color: '#262626'
              }}
            />
          );
        } else {
          const { asin, sku, name } = extractProductData(r.product);
          return (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              padding: '8px 0',
              height: '100%',
              minHeight: '80px'
            }}>
              {/* Верхняя строка - название продукта */}
              <div style={{ marginBottom: '8px' }}>
                <ProductNameTooltip 
                  text={name}
                  style={{
                    fontWeight: 500,
                    fontSize: 14,
                    color: '#262626',
                    lineHeight: '18px'
                  }}
                />
              </div>
              
              {/* Средняя и нижняя строки с фото */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                flex: 1
              }}>
                {/* Фото продукта */}
                <img 
                  src={r.img} 
                  style={{ 
                    width: 40, 
                    height: 40, 
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
                  height: '40px',
                  flex: 1
                }}>
                  {/* Средняя строка - ASIN */}
                  <div style={{ 
                    fontSize: 13, 
                    color: '#595959',
                    fontWeight: 500,
                    lineHeight: '18px'
                  }}>
                    {asin}
                  </div>
                  
                  {/* Нижняя строка - SKU */}
                  <div style={{ 
                    fontSize: 12, 
                    color: '#8c8c8c',
                    lineHeight: '18px'
                  }}>
                    SKU: {sku}
                  </div>
                </div>
              </div>
            </div>
          );
        }
      },
    },
    { headerName: 'Orders', field: 'orders', colId: 'orders', flex: 1, minWidth: 80, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['orders'] === false },
    { headerName: 'Clicks', field: 'clicks', colId: 'clicks', flex: 1, minWidth: 80, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['clicks'] === false },
    { headerName: 'Conversion, %', field: 'conversion', colId: 'conversion', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['conversion'] === false },
    { headerName: 'Comission Rate, %', field: 'rate', colId: 'rate', flex: 1, minWidth: 120, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['rate'] === false },
    { headerName: 'Margin, %', field: 'margin', colId: 'margin', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['margin'] === false },
    { headerName: 'Spend, $', field: 'spend', colId: 'spend', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['spend'] === false },
    { headerName: 'Promotional costs, $', field: 'promoCosts', colId: 'promoCosts', flex: 1, minWidth: 140, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['promoCosts'] === false },
    { headerName: 'Sales, $', field: 'sales', colId: 'sales', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['sales'] === false },
    { headerName: 'Profit, $', field: 'profit', colId: 'profit', flex: 1, minWidth: 100, sortable: true, filter: 'agNumberColumnFilter', hide: columnVisibility['profit'] === false },
  ] as any;

  const filtered = React.useMemo(() => {
    return detailsRowsBase.filter(r => {
      if (filters.asin && r.asin !== filters.asin) return false;
      if (viewMode === 'blogger' && filters.blogger && r.blogger !== filters.blogger) return false;
      return true;
    });
  }, [filters.asin, filters.blogger, viewMode]);


  return (
    <div>
      <div style={{ marginBottom: 10, padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
        <Radio.Group 
          size="small" 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
        >
          <Radio.Button value="product">Product</Radio.Button>
          <Radio.Button value="blogger">Blogger</Radio.Button>
        </Radio.Group>
      </div>
      

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0 }}>Details Table:</h4>
          <TablePresets 
            tableId="details" 
            onPresetChange={handlePresetChange}
            onSavePreset={saveCurrentSettings}
          />
        </div>
        <div className="ag-theme-alpine" style={{ width: '100%', position: 'relative' }}>
          <ColumnVisibilityControl 
            columnDefs={columnDefs}
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
            rowData={filtered}
            columnDefs={columnDefs}
            theme="legacy"
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            suppressHorizontalScroll={false}
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={true}
            domLayout="autoHeight"
            rowHeight={96}
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
  const [visibleKeys, setVisibleKeys] = React.useState<string[]>(allMetrics as string[]);
  const [tileOrder, setTileOrder] = React.useState<string[]>(allMetrics as string[]);
  const [tilesPresets, setTilesPresets] = React.useState<{name:string; visibleTiles:string[]; tileOrder:string[]}[]>(
    () => { try { return JSON.parse(localStorage.getItem('tilesPresets') || '[]'); } catch { return []; } }
  );
  const [newPresetName, setNewPresetName] = React.useState('');
  const [presetsOpen, setPresetsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<[Dayjs, Dayjs] | null>(null);
  const [showDetails, setShowDetails] = React.useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = React.useState<string | undefined>(undefined);
  const [selectedBlogger, setSelectedBlogger] = React.useState<string | undefined>(undefined);
  const [selectedAsin, setSelectedAsin] = React.useState<string | undefined>(undefined);
  const [selectedLink, setSelectedLink] = React.useState<string | undefined>(undefined);

  const savePresets = (next: typeof tilesPresets) => {
    setTilesPresets(next);
    localStorage.setItem('tilesPresets', JSON.stringify(next));
  };

  const items: MenuProps['items'] = allMetrics.map(m => ({
    key: m as string,
    label: (
      <Checkbox
        onClick={e => e.stopPropagation()}
        defaultChecked={(visibleKeys as string[]).includes(m as string)}
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

  return (
    <ConfigProvider theme={appTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: 'transparent', padding: 0 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 12px' }}>
            <Typography.Title level={2} style={{ margin: '24px 0 20px' }}>Dashboard</Typography.Title>
          </div>
        </Header>
        <Content>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 20, alignItems: 'center' }}>
              <Select
                style={{ minWidth: 180 }}
                options={companyOptions}
                showSearch
                allowClear
                placeholder="Campaign"
                value={selectedCompany}
                onChange={(v) => setSelectedCompany(v)}
                filterOption={(input, option) => (String(option?.value || '')).toLowerCase().includes(input.toLowerCase())}
              />
              <Select style={{ minWidth: 180 }} options={bloggerOptions} showSearch allowClear placeholder="Blogger" value={selectedBlogger} onChange={(v) => setSelectedBlogger(v)} />
              <Select style={{ minWidth: 180 }} options={asinOptions} showSearch allowClear placeholder="ASIN" value={selectedAsin} onChange={(v) => setSelectedAsin(v)} />
              {/* Content link select removed by request */}
              <RangePicker
                format="DD.MM.YYYY"
                presets={[
                  { label: 'Сегодня', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  { label: 'Вчера', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
                  { label: 'Эта неделя', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                  { label: 'Прошлая неделя', value: [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')] },
                  { label: 'Этот месяц', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: 'Прошлый месяц', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: 'Сентябрь 2025', value: [dayjs('2025-09-01').startOf('day'), dayjs('2025-09-30').endOf('day')] },
                  { label: 'Последние 3 месяца', value: [dayjs().subtract(3, 'month').startOf('month'), dayjs().endOf('month')] },
                ]}
                value={dateRange as any}
                onChange={(v) => setDateRange((v && v[0] && v[1]) ? [v[0], v[1]] : null)}
              />
              <Dropdown menu={{ items }} open={settingsOpen} onOpenChange={setSettingsOpen} trigger={["click"]}>
                <Button>⚙️ <DownOutlined /></Button>
              </Dropdown>

              <Dropdown
                open={presetsOpen}
                onOpenChange={setPresetsOpen}
                popupRender={() => (
                  <div style={{ padding: 8, width: 280, background: '#ffffff', boxShadow: '0 6px 16px rgba(0,0,0,0.15)', border: '1px solid #D9D9D9', borderRadius: 8 }}>
                    <Typography.Text strong>Presets</Typography.Text>
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                        <Button type="link" style={{ padding: 0 }} onClick={() => { setVisibleKeys(allMetrics as string[]); setTileOrder(allMetrics as string[]); setPresetsOpen(false); }}>None</Button>
                      </div>
                      {tilesPresets.length === 0 && <Typography.Text type="secondary">Нет пресетов</Typography.Text>}
                      {tilesPresets.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                          <Button type="link" style={{ padding: 0 }} onClick={() => applyPreset(p)}>{p.name}</Button>
                          <Button size="small" danger onClick={() => {
                            const next = tilesPresets.slice();
                            next.splice(idx, 1);
                            savePresets(next);
                          }}>Удалить</Button>
                        </div>
                      ))}
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input placeholder="Название нового пресета" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
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
                <Button>Presets <DownOutlined /></Button>
              </Dropdown>

              <Button type="primary" onClick={() => setShowDetails(v => !v)}>Details</Button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 15,
              maxWidth: 1600,
              margin: '0 auto 24px',
              overflowX: 'auto'
            }}>
              {tileOrder.filter(k => visibleKeys.includes(k)).map(m => (
                <div key={m} draggable onDragStart={handleDragStart(m)} onDragOver={handleDragOver(m)} onDragEnd={handleDragEnd}>
                  <MetricCard title={m} value={(curM as any)[m]} prev={(prevM as any)[m]} />
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <ChartsBlock dateRange={dateRange} />
              <SummaryToggle dateRange={dateRange} />
              <SummaryPanel dateRange={dateRange} />
            </div>

            {showDetails && (
              <div style={{ marginTop: 16 }}>
                <DetailsTable filters={{ asin: selectedAsin, blogger: selectedBlogger }} />
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <ContentTableCard
                filters={{ company: selectedCompany, blogger: selectedBlogger, asin: selectedAsin, link: selectedLink }}
                dateRange={dateRange}
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

function ContentTableCard({ filters, dateRange }: { filters: { company?: string; blogger?: string; asin?: string; link?: string }; dateRange: [Dayjs, Dayjs] | null }) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('contentCollapsed') || 'false'); } catch { return false; }
  });
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const gridRef = React.useRef<AgGridReact>(null);
  React.useEffect(() => { localStorage.setItem('contentCollapsed', JSON.stringify(collapsed)); }, [collapsed]);

  const allRows: ContentRow[] = React.useMemo(() => ([
    { key: 'c1', asin: 'B00123456', blogger: 'Иван Иванов', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), campaign: 'Amazon', link: 'https://youtube.com/watch?v=abc123' },
    { key: 'c2', asin: 'C00987654', blogger: 'Мария Смирнова', date: dayjs().format('YYYY-MM-DD'), campaign: 'eBay', link: 'https://instagram.com/p/xyz789' },
  ]), []);

  const rows = React.useMemo(() => {
    return allRows.filter(r => {
      if (filters.company && r.campaign !== filters.company) return false;
      if (filters.blogger && r.blogger !== filters.blogger) return false;
      if (filters.asin && r.asin !== filters.asin) return false;
      if (filters.link && r.link !== filters.link) return false;
      if (dateRange) {
        const d = dayjs(r.date).startOf('day');
        const [s, e] = dateRange;
        if (d.isBefore(s.startOf('day')) || d.isAfter(e.endOf('day'))) return false;
      }
      return true;
    });
  }, [allRows, filters, dateRange]);

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
              <h4 style={{ margin: 0 }}>Content Table:</h4>
              <TablePresets 
                tableId="content" 
                onPresetChange={handlePresetChange}
                onSavePreset={saveCurrentSettings}
              />
            </div>
            <div className="ag-theme-alpine" style={{ width: '100%', position: 'relative' }}>
              <ColumnVisibilityControl 
                columnDefs={columnDefs}
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
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                suppressHorizontalScroll={false}
                suppressColumnVirtualisation={true}
                suppressRowVirtualisation={true}
                domLayout="autoHeight"
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
      style={{ position: 'fixed', top: 128, right: open ? 364 : 4, zIndex: 50, border: '1px solid #D9D9D9', borderRadius: 16, background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
      aria-label="Toggle summary"
    >
      {open ? <RightCircleOutlined /> : <LeftCircleOutlined />}
    </Button>
  );
}

function SummaryPanel({ dateRange }: { dateRange: [Dayjs, Dayjs] | null }) {
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

  // Mock calculations based on existing demo totals
  const sales = curM.Sales;
  const units = curM.Orders; // using Orders as Units for demo
  const clicks = curM.Clicks;
  const conversion = parseFloat(String(curM.Conversion).replace('%', ''));
  const promoCost = (curM as any)['Promotional Costs'] ?? Math.round(curM.Spend * 0.25 * 100) / 100;
  const promoPerc = sales ? (promoCost / sales) * 100 : 0;
  const commissionPerc = parseFloat(String((curM as any)['Commision Rate']).replace('%', '')) || 7;
  const commissionUsd = sales * (commissionPerc / 100);
  const costPerc = 30; // demo
  const costUsd = sales * (costPerc / 100);
  const holdsPerc = 5; // demo
  const holdsUsd = sales * (holdsPerc / 100);
  const profit = curM.Profit;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: open ? 360 : 0, overflow: 'hidden', transition: 'width 0.2s ease', zIndex: 20, height: '100vh', paddingTop: '120px' }}>
      <Card styles={{ body: { padding: open ? 16 : 0, display: open ? 'block' : 'none', height: 'fit-content' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Typography.Text strong>Summary</Typography.Text>
          <Badge color="#007bff" text={<span style={{ color: '#666' }}>{periodText}</span>} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 6 }}>
          <RowLine label="Sales" value={`${fmtCurrency(sales)}`} />
          <RowLine label="Units" value={`${units}`} />
          <RowLine label="Promotional costs" value={`${fmtCurrency(promoCost)} / ${fmtPercent(promoPerc)}`} />
          <RowLine label="Comission rate" value={`${fmtCurrency(commissionUsd)} / ${fmtPercent(commissionPerc)}`} />
          <RowLine label="Cost price" value={`${fmtCurrency(costUsd)} / ${fmtPercent(costPerc)}`} />
          <RowLine label="Amazon Holds" value={`${fmtCurrency(holdsUsd)} / ${fmtPercent(holdsPerc)}`} />
          <RowLine label="Profit" value={`${fmtCurrency(profit)}`} />
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

