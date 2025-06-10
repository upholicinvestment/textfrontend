import { useState } from 'react';
import Summary from '../../Fii_Dii/Summary/Summary';
import FIIChart from '../../Fii_Dii/Fii_Dii/Fii_Dii_Fno';
import FII_DII_Data from '../../Fii_Dii/Fii_Dii/Fii_Dii_Activity';
import DIIChart from '../../Fii_Dii/Dii_Index/Dii_Index_Opt';
import ProChart from '../../Fii_Dii/Pro_Index/Pro_Index_Opt';
import ClientChart from '../../Fii_Dii/Client_Index/Client_Index_Opt';
import NiftyChart from '../Analysis/Analysis';

const Main_Page_Fii_Dii = () => {
  const [activeTab, setActiveTab] = useState('Summary');


  const tabs = [
    { id: 'history', label: 'Analysis' },
    { id: 'summary', label: 'Summary' },
    { id: 'fno', label: 'Futures and Options' },
    { id: 'cash', label: 'Cash Market' },
  ];


  // Add dark mode toggle button in your header
  const HistoryContent = () => (
    <div className="sensibull-tab-content">
      <NiftyChart />
    </div>
  );

  const SummaryContent = () => (
    <div className="sensibull-tab-content">
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
      <div className="sensibull-tab-content">
        <h3>Futures & Options Data</h3>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="participant-select" style={{ marginRight: '10px' }}>
            Select Participant:
          </label>
          <select
            id="participant-select"
            value={activeParticipant}
            onChange={(e) => setActiveParticipant(e.target.value)}
            className="sensibull-dropdown"
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
    <div className="sensibull-tab-content">
      <h3>Cash Market Data</h3>
      <p>Equity market trading information</p>
      <FII_DII_Data />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Summary':
        return <SummaryContent />;
      case 'Futures and Options':
        return <FNOContent />;
      case 'Cash Market':
        return <CashContent />;
      case 'Analysis':
        return <HistoryContent />;
      default:
        return <SummaryContent />;
    }
  };

  return (
    <div className={`sensibull-container`}>
      <div className="sensibull-header-ui">
        <div className="sensibull-tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sensibull-tab-item ${
                activeTab === tab.label ? 'sensibull-tab-active' : ''
              }`}
              onClick={() => setActiveTab(tab.label)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Add dark mode toggle button */}
      </div>

      <div className="sensibull-content-area">{renderTabContent()}</div>
    </div>
  );
};

export default Main_Page_Fii_Dii;