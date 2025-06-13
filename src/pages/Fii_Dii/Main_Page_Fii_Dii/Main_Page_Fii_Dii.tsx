import { useState } from 'react';
import Summary from '../../Fii_Dii/Summary/Summary';
import FIIChart from '../../Fii_Dii/Fii_Dii/Fii_Dii_Fno';
import FII_DII_Data from '../../Fii_Dii/Fii_Dii/Fii_Dii_Activity';
import DIIChart from '../../Fii_Dii/Dii_Index/Dii_Index_Opt';
import ProChart from '../../Fii_Dii/Pro_Index/Pro_Index_Opt';
import ClientChart from '../../Fii_Dii/Client_Index/Client_Index_Opt';
import NiftyChart from '../Analysis/Analysis';
import Navbar from '../../../components/layout/Navbar/Navbar';

const Main_Page_Fii_Dii = () => {
  const [activeTab, setActiveTab] = useState('Summary');

  const tabs = [
    { id: 'history', label: 'Analysis' },
    { id: 'summary', label: 'Summary' },
    { id: 'fno', label: 'F&O' },
    { id: 'cash', label: 'Cash' },
  ];

  const HistoryContent = () => (
    <div className="mt-4 sm:mt-6">
      <NiftyChart />
    </div>
  );

  const SummaryContent = () => (
    <div className="mt-4 sm:mt-6">
      <Summary />
    </div>
  );

  const FNOContent = () => {
    const [activeParticipant, setActiveParticipant] = useState('FII');
    const participantTabs = ['FII', 'DII', 'Pro', 'Client'];

    const renderParticipantChart = () => {
      switch (activeParticipant) {
        case 'FII':
          return <FIIChart />;
        case 'DII':
          return <DIIChart />;
        case 'Pro':
          return <ProChart />;
        case 'Client':
          return <ClientChart />;
        default:
          return null;
      }
    };

    return (
      <div className="mt-4 sm:mt-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Futures & Options Data</h3>
        <div className="mb-4 sm:mb-6">
          <label htmlFor="participant-select" className="mr-2 text-gray-700 text-sm sm:text-base">
            Select Participant:
          </label>
          <select
            id="participant-select"
            value={activeParticipant}
            onChange={(e) => setActiveParticipant(e.target.value)}
            className="px-2 py-1 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {participantTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </div>
        <div>{renderParticipantChart()}</div>
      </div>
    );
  };

  const CashContent = () => (
    <div className="mt-4 sm:mt-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Cash Market Data</h3>
      <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Equity market trading information</p>
      <FII_DII_Data />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Summary':
        return <SummaryContent />;
      case 'F&O':
        return <FNOContent />;
      case 'Cash':
        return <CashContent />;
      case 'Analysis':
        return <HistoryContent />;
      default:
        return <SummaryContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar at the top with no margin above */}
      <Navbar />
      
      {/* Spacer div below navbar only */}
      <div className="h-6 sm:h-8"></div>
      
      {/* Main content container */}
      <div className="px-4 sm:px-6 pb-6 mt-[70px]">
        {/* Tabs navigation */}
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex flex-wrap gap-1 bg-white rounded-lg shadow-sm p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.label
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content area */}
        <div className="w-full">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Main_Page_Fii_Dii;