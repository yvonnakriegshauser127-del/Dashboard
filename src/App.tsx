import React from 'react';
import {
  ConfigProvider, Layout, Typography, Space, Select, DatePicker, Button,
  Dropdown, Checkbox, Card, Table, Input, Divider, Tooltip, Switch, Badge
} from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, UpOutlined, CaretRightOutlined, CaretLeftOutlined } from '@ant-design/icons';
import Chart from 'chart.js/auto';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

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
      <span style={{ color: '#999', fontSize: 12, marginLeft: 12 }}>
        {`${dayjs(o.start).format('DD.MM.YY')} - ${dayjs(o.end).format('DD.MM.YY')}`}
      </span>
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
    const arrN = (total: number) => Array(labels.length).fill(total / Math.max(labels.length, 1));
    const moneySelected = checks.spend || checks.profit;
    const countSelected = checks.orders;
    const bothUnits = moneySelected && countSelected;
    const yLeftId = 'yLeftTop';
    const yRightId = 'yRightTop';
    const datasets: any[] = [];
    const addPair = (name: string, value: number, color: string, yAxisID: string) => {
      const data = arrN(value);
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
    if (checks.spend) addPair('Spend', curM.Spend, '#1f77b4', bothUnits ? yLeftId : yLeftId);
    if (checks.profit) addPair('Profit', curM.Profit, '#ff7f0e', bothUnits ? yLeftId : yLeftId);
    if (checks.orders) addPair('Orders', curM.Orders, '#33a02c', bothUnits ? yRightId : yLeftId);
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
        plugins: {
          legend: {
            labels: {
              filter: (item: any, chart: any) => {
                const ds = chart?.data?.datasets?.[item.datasetIndex];
                return !ds?.isBar;
              }
            },
          },
        },
        scales: {
          [yLeftId]:  { position: 'left',  display: moneySelected || (!moneySelected && !countSelected), ticks: { callback: (val: any) => `$${(+val).toFixed(2)}` } },
          [yRightId]: { position: 'right', display: bothUnits, ticks: { callback: (val: any) => `${(+val).toFixed(0)}` } },
        },
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
      bodyStyle={collapsed ? { display: 'none', padding: 0 } : undefined}
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
    const arrN = (base: number) => Array(labels.length).fill(0).map((_, i) => Math.max(0, Math.round(base + (i - labels.length / 2) * (base * 0.05))));
    const arrPerc = (base: number) => Array(labels.length).fill(0).map((_, i) => Math.max(0, +(base + (i - labels.length / 2) * 0.1).toFixed(1)));

    const selectedUnits: ('count' | 'percent')[] = [];
    if (checks.clicks) selectedUnits.push('count');
    if (checks.orders) selectedUnits.push('count');
    if (checks.conversion) selectedUnits.push('percent');
    const hasPercent = selectedUnits.includes('percent');
    const hasCount = selectedUnits.includes('count');

    const yLeftId = 'yLeft2';
    const yRightId = 'yRight2';

    const datasets: any[] = [];
    const addPair = (name: string, data: number[], color: string, yAxisID: string) => {
      datasets.push({ label: `${name} bars`, data, yAxisID, type: 'bar', backgroundColor: color + '55', borderColor: color, isBar: true, order: 1, maxBarThickness: 25, categoryPercentage: 0.6, barPercentage: 0.8 });
      datasets.push({ label: name, data, yAxisID, type: 'line', borderColor: color, backgroundColor: color + '33', fill: false, tension: 0.3, order: 2 });
    };
    if (checks.clicks) addPair('Clicks', arrN(200), '#1f77b4', hasPercent && hasCount ? yLeftId : yLeftId);
    if (checks.orders) addPair('Orders', arrN(50), '#33a02c', hasPercent && hasCount ? yLeftId : yLeftId);
    if (checks.conversion) addPair('Conversion', arrPerc(5), '#ff7f0e', hasPercent && hasCount ? yRightId : yLeftId);

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
        plugins: {
          legend: {
            labels: {
              filter: (item: any, chart: any) => {
                const ds = chart?.data?.datasets?.[item.datasetIndex];
                return !ds?.isBar;
              },
            },
          },
        },
        scales: {
          [yLeftId]: { position: 'left', display: hasCount || (!hasCount && !hasPercent), ticks: { callback: (val: any) => `${(+val).toFixed(0)}` } },
          [yRightId]: { position: 'right', display: hasPercent && hasCount, ticks: { callback: (val: any) => `${(+val).toFixed(1)}%` } },
        },
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
  React.useEffect(() => {
    const onStorage = () => {
      try { setCollapsed(JSON.parse(localStorage.getItem('chartsCollapsed') || 'false')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return (
    <>
      <ChartCard dateRange={dateRange} collapsed={collapsed} />
      {!collapsed && (
        <div style={{ marginTop: 16 }}>
          <SecondaryChart dateRange={dateRange} />
        </div>
      )}
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
};

const extractAsin = (product: string) => product.split(' ')[0];

const detailsRowsBase: Row[] = [
  { key:'1', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'B0AAA11111 (SKU: HVM-70001) Stainless Steel Toilet Brush and Holder – Matte Black', asin: 'B0AAA11111', blogger:'Иван Иванов', orders:0, clicks:0, conversion:0, rate:7, margin:15, spend:0, sales:0, profit:0 },
  { key:'2', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0BBB22222 (SKU: HVM-70002) 720° Rotating Faucet Aerator – Splash-proof Smart Filter', asin: 'B0BBB22222', blogger:'Мария Смирнова', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72 },
  { key:'3', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKprCjvW5CbqPRI9Qt8DIHJVztC4FlWkoSfg&s', product:'B0CCC33333 (SKU: HVM-70003) Gold Toilet Brush and Holder – Brushed Stainless Steel', asin: 'B0CCC33333', blogger:'Иван Иванов', orders:2, clicks:30, conversion:6.7, rate:7, margin:53, spend:0, sales:25.28, profit:13.44 },
  { key:'4', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLGQ3xRxuRsEnru3EiWdylLg7GVaEESV8Yg&s', product:'B0DDD44444 (SKU: HVM-70004) Gold Toilet Brush and Holder – Deluxe Edition', asin: 'B0DDD44444', blogger:'Мария Смирнова', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72 },
];

// Initialize asinOptions now that detailsRowsBase is known
asinOptions = Array.from(new Set(detailsRowsBase.map(r => r.asin))).map(a => ({ value: a, label: a }));

function DetailsTable({ filters }: { filters: { asin?: string; blogger?: string } }) {
  const [showBlogger, setShowBlogger] = React.useState(false);

  const columns = [
    {
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Switch size="small" checked={showBlogger} onChange={setShowBlogger} />
          <span style={{ marginLeft: 8 }}>{showBlogger ? 'Blogger' : 'Product'}</span>
        </span>
      ),
      key: 'productOrBlogger',
      sorter: (a: Row, b: Row) => {
        if (showBlogger) return (a.blogger || '').localeCompare(b.blogger || '');
        return a.product.localeCompare(b.product);
      },
      render: (_: any, r: Row) => (
        showBlogger ? (
          <span style={{ fontSize: 14 }}>{r.blogger || ''}</span>
        ) : (
        <span>
          <img src={r.img} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />
          <span style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: 14, lineHeight: 1.2 }}>{r.product}</span>
        </span>
        )
      ),
    },
    { title: 'Orders', dataIndex: 'orders', key: 'orders', sorter: (a: Row, b: Row) => a.orders - b.orders },
    { title: 'Clicks', dataIndex: 'clicks', key: 'clicks', sorter: (a: Row, b: Row) => a.clicks - b.clicks },
    { title: 'Conversion, %', dataIndex: 'conversion', key: 'conversion', sorter: (a: Row, b: Row) => a.conversion - b.conversion, render: (v: number) => v },
    { title: 'Comission Rate, %', dataIndex: 'rate', key: 'rate', sorter: (a: Row, b: Row) => a.rate - b.rate, render: (v: number) => v },
    { title: 'Margin, %', dataIndex: 'margin', key: 'margin', sorter: (a: Row, b: Row) => a.margin - b.margin, render: (v: number) => v },
    { title: 'Spend, $', dataIndex: 'spend', key: 'spend', sorter: (a: Row, b: Row) => a.spend - b.spend, render: (v: number) => v.toFixed(2) },
    { title: 'Sales, $', dataIndex: 'sales', key: 'sales', sorter: (a: Row, b: Row) => a.sales - b.sales, render: (v: number) => v.toFixed(2) },
    { title: 'Profit, $', dataIndex: 'profit', key: 'profit', sorter: (a: Row, b: Row) => a.profit - b.profit, render: (v: number) => v.toFixed(2) },
  ];

  const filtered = React.useMemo(() => {
    return detailsRowsBase.filter(r => {
      if (filters.asin && r.asin !== filters.asin) return false;
      if (showBlogger && filters.blogger && r.blogger !== filters.blogger) return false;
      return true;
    });
  }, [filters.asin, filters.blogger, showBlogger]);

  return <Table columns={columns as any} dataSource={filtered} pagination={false} />;
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
                dropdownRender={() => (
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

            <div style={{ position: 'relative', paddingRight: 52 }}>
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
    try { return JSON.parse(localStorage.getItem('contentCollapsed') || 'true'); } catch { return true; }
  });
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

  const columns = React.useMemo(() => ([
    { title: 'ASIN', dataIndex: 'asin', key: 'asin' },
    { title: 'Blogger', dataIndex: 'blogger', key: 'blogger' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => dayjs(v).format('DD.MM.YYYY') },
    { title: 'Campaign', dataIndex: 'campaign', key: 'campaign' },
    { title: 'Content link', dataIndex: 'link', key: 'link', render: (v: string) => <a href={v} target="_blank" rel="noreferrer">{v}</a> },
  ]), []);

  return (
    <Card
      title="Content"
      style={{ maxWidth: 1600, margin: '0 auto' }}
      bodyStyle={collapsed ? { display: 'none', padding: 0 } : undefined}
      extra={
        <Button type="text" onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <DownOutlined /> : <UpOutlined />}
        </Button>
      }
    >
      {!collapsed && (
        <Table columns={columns as any} dataSource={rows} pagination={false} />
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
      style={{ position: 'absolute', top: 8, right: open ? 364 : 4, zIndex: 50, border: '1px solid #D9D9D9', borderRadius: 16, background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
      aria-label="Toggle summary"
    >
      {open ? <CaretRightOutlined /> : <CaretLeftOutlined />}
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
    <div style={{ position: 'absolute', top: 0, right: 0, width: open ? 360 : 0, overflow: 'hidden', transition: 'width 0.2s ease', zIndex: 20 }}>
      <Card bodyStyle={{ padding: open ? 16 : 0, display: open ? 'block' : 'none' }}>
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

