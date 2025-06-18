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
  { key: 'Nifty_Close', label: 'Nifty Close', color: '#4C78A8', axis: 'right' }, // Deep blue
  { key: 'FII_Cash_Net', label: 'FII Cash Net', color: '#e8183a', axis: 'left' }, // Coral red
  { key: 'DII_Cash_Net', label: 'DII Cash Net', color: '#54A24B', axis: 'left' }, // Leaf green
  { key: 'FII_Index_Futures', label: 'FII Index Futures Net OI', color: '#F58518', axis: 'left' }, // Orange
  { key: 'Client_Index_Futures', label: 'Client Index Futures Net OI', color: '#EECA3B', axis: 'left' }, // Yellow
  { key: 'FII_Index_Options', label: 'FII Index Options Net OI', color: '#B279A2', axis: 'left' }, // Mauve
  { key: 'Client_Index_Options', label: 'Client Index Options Net OI', color: '#17BECF', axis: 'left' }, // Teal
];

const monthOrder = ['01','02','03','04','05','06','07','08','09','10','11','12'];
function extractMonths(data: NetOIData[]) {
  const months = new Set<string>();
  data.forEach(d => {
    const [, month] = d.date.split('-');
    months.add(month);
  });
  return monthOrder.filter(m => months.has(m));
}
function monthLabel(month: string) {
  return dayjs('2024-' + month + '-01').format('MMM');
}

export default function NetOIChart() {
  const [data, setData] = useState<NetOIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState<string[]>(allSeries.map(series => series.key));
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/net-oi')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
        const ms = extractMonths(json);
        setMonths(ms);
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

  const filteredData = data.filter(d => {
    if (!selectedMonth) return true;
    const [, month] = d.date.split('-');
    return month === selectedMonth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[340px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Net OI & Cash Activity Dashboard</h1>
          <p className="text-blue-100">
            Visualize Net OI of FII/Client and Nifty performance, with Cash market trend
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart Section */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Net OI Analysis</h2>
            <p className="text-gray-500 text-sm">Monthly trends for FII/DII activities and Nifty performance</p>
          </div>
          
          {/* Months Tab Switches */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
            {months.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  month === selectedMonth
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {monthLabel(month)}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="w-full h-[340px] sm:h-[410px] md:h-[510px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: "#5a5c69" }} 
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fontSize: 12, fill: "#5a5c69" }}
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={['auto', 'auto']} 
                  tick={{ fontSize: 12, fill: "#4C78A8" }}
                  tickMargin={10}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e3e6f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.07)',
                    fontSize: "13px",
                  }}
                  itemStyle={{
                    padding: '4px 0',
                    fontSize: '14px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '13px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '16px'
                  }} 
                />
                {allSeries.map(series => (
                  selectedSeries.includes(series.key) && (
                    <Area
                      key={series.key}
                      yAxisId={series.axis}
                      type="monotone"
                      dataKey={series.key}
                      fill={`${series.color}1A`} // ~10% opacity fill
                      stroke={series.color}
                      strokeWidth={2}
                      activeDot={{ 
                        r: 5,
                        stroke: series.color,
                        strokeWidth: 2,
                        fill: '#fff'
                      }}
                      name={series.label}
                      dot={false}
                    />
                  )
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controls */}
        <div className={`${showControls ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100`}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Chart Controls</h3>
            <p className="text-gray-500 text-sm">Toggle series visibility</p>
          </div>
          <label className="flex items-center mb-4 pb-4 border-b border-gray-200">
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
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="ml-2 font-medium text-gray-700">Select All</span>
          </label>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {allSeries.map(series => (
              <label
                key={series.key}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSeries.includes(series.key)}
                  onChange={() => handleCheckboxChange(series.key)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <div 
                  className="w-3 h-3 ml-2 mr-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: series.color }}
                ></div>
                <span className="text-sm text-gray-700 truncate">{series.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Controls Button */}
      <button 
        onClick={() => setShowControls(!showControls)}
        className="lg:hidden mt-2 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>
    </div>
  );
}
