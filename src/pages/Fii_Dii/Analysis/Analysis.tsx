import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';

type NetOIData = {
  date: string;
  FII_Index_Futures: number;
  FII_Index_Options: number;
  Client_Index_Futures: number;
  Client_Index_Options: number;
  Nifty_Close: number;
  FII_Cash_Net: number;
  DII_Cash_Net: number;
};

const allSeries = [
  { key: 'Nifty_Close', label: 'Nifty Close', color: '#4e73df', axis: 'right' },
  { key: 'FII_Cash_Net', label: 'FII Cash Net', color: '#e74a3b', axis: 'left' },
  { key: 'DII_Cash_Net', label: 'DII Cash Net', color: '#1cc88a', axis: 'left' },
  { key: 'FII_Index_Futures', label: 'FII Index Futures Net OI', color: '#36b9cc', axis: 'left' },
  { key: 'Client_Index_Futures', label: 'Client Index Futures Net OI', color: '#f6c23e', axis: 'left' },
  { key: 'FII_Index_Options', label: 'FII Index Options Net OI', color: '#858796', axis: 'left' },
  { key: 'Client_Index_Options', label: 'Client Index Options Net OI', color: '#5a5c69', axis: 'left' },
];

// Month order for Jan–Dec
const monthOrder = ['01','02','03','04','05','06','07','08','09','10','11','12'];

function extractMonths(data: NetOIData[]) {
  // Use only month number (MM)
  const months = new Set<string>();
  data.forEach(d => {
    const [, month] = d.date.split('-');
    months.add(month);
  });
  // Return months present in data, sorted Jan–Dec
  return monthOrder.filter(m => months.has(m));
}

function monthLabel(month: string) {
  // '01' => 'Jan'
  return dayjs('2024-' + month + '-01').format('MMM');
}

export default function NetOIChart() {
  const [data, setData] = useState<NetOIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<string[]>(allSeries.map(series => series.key));
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/net-oi')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
        const ms = extractMonths(json);
        setMonths(ms);
        // Default: latest month present in the data
        if (json.length) {
          const latestMonth = json[json.length - 1].date.split('-')[1];
          setSelectedMonth(latestMonth);
        } else {
          setSelectedMonth(ms[0] ?? null);
        }
      })
      .catch(err => {
        console.error('Error fetching Net OI data:', err);
        setLoading(false);
      });
  }, []);

  const handleCheckboxChange = (key: string) => {
    setSelectedSeries(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Filter data for selected month (any year)
  const filteredData = data.filter(d => {
    if (!selectedMonth) return true;
    const [, month] = d.date.split('-');
    return month === selectedMonth;
  });

  if (loading) {
    return <div className="text-center p-4">Loading chart...</div>;
  }

  return (
    <div className="graph-container" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Chart */}
      <div className="chart-wrapper" style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1)', padding: '20px' }}>
        {/* Months Button Group */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {months.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: '7px 18px',
                borderRadius: '5px',
                border: month === selectedMonth ? '2px solid #4e73df' : '1px solid #e3e6f0',
                background: month === selectedMonth ? '#4e73df' : '#fff',
                color: month === selectedMonth ? '#fff' : '#4e73df',
                fontWeight: month === selectedMonth ? 700 : 500,
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.16s'
              }}
            >
              {monthLabel(month)}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5a5c69' }} />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12, fill: '#5a5c69' }} />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#5a5c69' }} />
            <Tooltip contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e3e6f0',
              borderRadius: '0.35rem',
              boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
            }} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
            {allSeries.map(series => (
              selectedSeries.includes(series.key) && (
                <Area
                  key={series.key}
                  yAxisId={series.axis}
                  type="monotone"
                  dataKey={series.key}
                  fill='none'
                  stroke={series.color}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name={series.label}
                  dot={false}
                />
              )
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Checkboxes */}
      <div className="controls-wrapper" style={{
        minWidth: '220px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1)',
        padding: '20px'
      }}>
        <h3 style={{
          marginBottom: '15px',
          color: '#5a5c69',
          fontSize: '16px'
        }}>Toggle Series</h3>

        <label className="select-all" style={{
          display: 'block',
          marginBottom: '15px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e3e6f0'
        }}>
          <input
            type="checkbox"
            checked={selectedSeries.length === allSeries.length}
            onChange={() => {
              if (selectedSeries.length === allSeries.length) {
                setSelectedSeries([]);
              } else {
                setSelectedSeries(allSeries.map(series => series.key));
              }
            }}
          />
          <span style={{
            fontWeight: 'bold',
            marginLeft: '8px',
            color: '#4e73df'
          }}>Select All</span>
        </label>
        {allSeries.map(series => (
          <label
            key={series.key}
            className="series-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={selectedSeries.includes(series.key)}
              onChange={() => handleCheckboxChange(series.key)}
              style={{ marginRight: '8px' }}
            />
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: series.color,
              marginRight: '8px',
              borderRadius: '3px'
            }}></div>
            <span style={{
              color: '#5a5c69',
              fontSize: '14px'
            }}>{series.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}