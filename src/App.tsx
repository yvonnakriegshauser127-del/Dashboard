import React from 'react';
import {
  ConfigProvider, Layout, Typography, Space, Select, DatePicker, Button,
  Dropdown, Checkbox, Card, Table, Input, Divider
} from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import Chart from 'chart.js/auto';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

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

const companyOptions = [
  { value: 'Amazon', label: 'Amazon' },
  { value: 'eBay', label: 'eBay' },
];
const bloggerOptions = [
  { value: 'Иван Иванов', label: 'Иван Иванов' },
  { value: 'Мария Смирнова', label: 'Мария Смирнова' },
];
const asinOptions = [
  { value: 'B00123456', label: 'B00123456' },
  { value: 'C00987654', label: 'C00987654' },
];
const linkOptions = [
  { value: 'https://youtube.com/watch?v=abc123', label: 'https://youtube.com/watch?v=abc123' },
  { value: 'https://instagram.com/p/xyz789', label: 'https://instagram.com/p/xyz789' },
  { value: 'https://tiktok.com/@user/video/456', label: 'https://tiktok.com/@user/video/456' },
  { value: 'https://blog.example.com/post-1', label: 'https://blog.example.com/post-1' },
  { value: 'https://youtube.com/shorts/def456', label: 'https://youtube.com/shorts/def456' },
];

const prevM = { Spend:1774.18, Clicks:3249, Orders:120, Sales:8065.07, Conversion:'12%', 'Commision Rate':'5%', Profit:3200 } as const;
const curM  = { Spend:3372.42, Clicks:6200, Orders:100, Sales:15450.24, Conversion:'15%', 'Commision Rate':'7%', Profit:5400 } as const;
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
    if (checks.spend) datasets.push({ label: 'Spend', data: arrN(curM.Spend), yAxisID: bothUnits ? yLeftId : yLeftId, borderColor: '#1f77b4', backgroundColor: '#1f77b433', fill: false, tension: 0.3 });
    if (checks.profit) datasets.push({ label: 'Profit', data: arrN(curM.Profit), yAxisID: bothUnits ? yLeftId : yLeftId, borderColor: '#ff7f0e', backgroundColor: '#ff7f0e33', fill: false, tension: 0.3 });
    if (checks.orders) datasets.push({ label: 'Orders', data: arrN(curM.Orders), yAxisID: bothUnits ? yRightId : yLeftId, borderColor: '#33a02c', backgroundColor: '#33a02c33', fill: false, tension: 0.3 });
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
            labels: { filter: () => true },
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
  const [checks, setChecks] = React.useState<{ clicks: boolean; orders: boolean; conversion: boolean; none: boolean }>({ clicks: true, orders: true, conversion: false, none: false });
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
    if (checks.clicks) datasets.push({ label: 'Clicks', data: arrN(200), yAxisID: hasPercent && hasCount ? yLeftId : yLeftId, borderColor: '#1f77b4', backgroundColor: '#1f77b433', fill: false, tension: 0.3 });
    if (checks.orders) datasets.push({ label: 'Orders', data: arrN(50), yAxisID: hasPercent && hasCount ? yLeftId : yLeftId, borderColor: '#33a02c', backgroundColor: '#33a02c33', fill: false, tension: 0.3 });
    if (checks.conversion) datasets.push({ label: 'Conversion', data: arrPerc(5), yAxisID: hasPercent && hasCount ? yRightId : yLeftId, borderColor: '#ff7f0e', backgroundColor: '#ff7f0e33', fill: false, tension: 0.3 });

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
              filter: (legendItem) => {
                return true; // we only add selected datasets
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
  orders: number;
  clicks: number;
  conversion: number;
  rate: number;
  margin: number;
  spend: number;
  sales: number;
  profit: number;
};

function DetailsTable() {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      sorter: (a: Row, b: Row) => a.product.localeCompare(b.product),
      render: (_: any, r: Row) => (
        <span>
          <img src={r.img} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />
          <span style={{ display: 'inline-block', verticalAlign: 'middle', fontSize: 14, lineHeight: 1.2 }}>{r.product}</span>
        </span>
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

  const data: Row[] = [
    { key:'1', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtJr-cqOx04hXoXD06NMfsGlB-UFxHD3rAaA&s', product:'BOOTCT7ZSP (SKU: HVM-62001) Black Toilet Brush and Holder Set – Scratch Resistant Black Toilet Bowl Brush and...', orders:0, clicks:0, conversion:0, rate:7, margin:15, spend:0, sales:0, profit:0 },
    { key:'2', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpbMMyNkEN6q0bscf53nWBb3F3pXAJr11NfQ&s', product:'B0CLRT7NVS (SKU: HVM-62003) 2Pcs Universal 720° Rotating Faucet – Splash-proof Smart Filter Faucet for Kitchen…', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72 },
    { key:'3', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKprCjvW5CbqPRI9Qt8DIHJVztC4FlWkoSfg&s', product:'B0CLRT7NVS (SKU: HVM-62003) Gold Toilet Brush and Holder Set – Brushed Stainless Steel Gold Toilet Bowl Brush and...', orders:2, clicks:30, conversion:6.7, rate:7, margin:53, spend:0, sales:25.28, profit:13.44 },
    { key:'4', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJLGQ3xRxuRsEnru3EiWdylLg7GVaEESV8Yg&s', product:'B0CLRT7NVS (SKU: HVM-62003) Gold Toilet Brush and Holder Set – Brushed Stainless Steel Gold Toilet Bowl Brush and...', orders:1, clicks:15, conversion:6.7, rate:7, margin:53, spend:0, sales:12.64, profit:6.72 },
  ];

  return <Table columns={columns as any} dataSource={data} pagination={false} />;
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
  const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
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
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 12px' }}>
            <Typography.Title level={2} style={{ margin: '24px 0 20px' }}>Dashboard</Typography.Title>
          </div>
        </Header>
        <Content>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 20, alignItems: 'center' }}>
              <Select style={{ minWidth: 180 }} options={companyOptions} showSearch allowClear placeholder="Campaign" value={selectedCompany} onChange={(v) => setSelectedCompany(v)} />
              <Select style={{ minWidth: 180 }} options={bloggerOptions} showSearch allowClear placeholder="Blogger" value={selectedBlogger} onChange={(v) => setSelectedBlogger(v)} />
              <Select style={{ minWidth: 180 }} options={asinOptions} showSearch allowClear placeholder="ASIN" value={selectedAsin} onChange={(v) => setSelectedAsin(v)} />
              <Select style={{ minWidth: 260 }} options={linkOptions} showSearch allowClear placeholder="Content link" value={selectedLink} onChange={(v) => setSelectedLink(v)} />
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))',
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

            <ChartsBlock dateRange={dateRange} />

            <div style={{ marginTop: 16 }}>
              <ContentTableCard
                filters={{ company: selectedCompany, blogger: selectedBlogger, asin: selectedAsin, link: selectedLink }}
                dateRange={dateRange}
              />
            </div>

            {showDetails && (
              <div style={{ marginTop: 16 }}>
                <DetailsTable />
              </div>
            )}
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

