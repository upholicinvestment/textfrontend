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
    fetch('https://www.upholictech.com/api/net-oi')
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
    return <div className="text-center p-4">Loading chart...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Mobile toggle button - only shows on small screens */}
      <button 
        onClick={() => setShowControls(!showControls)}
        className="lg:hidden mb-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
      >
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart - always visible */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6">
          {/* Months Button Group */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {months.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1 text-sm sm:px-4 sm:py-2 sm:text-base rounded-md transition-colors ${
                  month === selectedMonth
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-blue-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {monthLabel(month)}
              </button>
            ))}
          </div>
          
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e3e6f0',
                    borderRadius: '0.35rem',
                    boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px',
                    display: 'flex',
                    flexWrap: 'wrap'
                  }} 
                />
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
                      activeDot={{ r: 4 }}
                      name={series.label}
                      dot={false}
                    />
                  )
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controls - hidden on mobile unless toggled */}
        <div className={`${showControls ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white rounded-lg shadow-sm p-4 lg:p-6`}>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Toggle Series</h3>

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
              className="mr-2"
            />
            <span className="font-semibold text-blue-600">Select All</span>
          </label>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {allSeries.map(series => (
              <label
                key={series.key}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedSeries.includes(series.key)}
                  onChange={() => handleCheckboxChange(series.key)}
                  className="mr-2"
                />
                <div 
                  className="w-3 h-3 mr-2 rounded-sm"
                  style={{ backgroundColor: series.color }}
                ></div>
                <span className="text-sm text-gray-700 truncate">{series.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}