import React from "react";

interface PlanOfActionProps {
  planOfAction?: string[] | null;
}

const PlanOfAction: React.FC<PlanOfActionProps> = ({ planOfAction }) => {
  const list = (planOfAction ?? []).slice(0, 3); // hard-cap to 3 pointers

  return (
    <>
      <style>
        {`
          .glass-card {
            background: bg-[#0a0d13];
            backdrop-filter: blur(12px);
            border: 1px solid rgba(75, 85, 99, 0.2);
          }
          .trading-glow {
            box-shadow: 0 0 12px rgba(59,130,246,0.10), 0 2px 10px rgba(0,0,0,0.2);
          }
          .step-glow { box-shadow: 0 0 7px rgba(34,197,94,0.18); }
          .action-card {
            background: #121212;
            border: 1px solid rgba(75,85,99,0.19);
            transition: all 0.24s cubic-bezier(0.4,0,0.2,1);
          }
          .action-card:hover {
            background: linear-gradient(135deg, rgba(31,41,55,0.7) 0%, rgba(17,24,39,0.85) 100%);
            border: 1px solid rgba(34,197,94,0.25);
            transform: translateY(-1px);
            box-shadow: 0 5px 14px rgba(0,0,0,0.18), 0 0 7px rgba(34,197,94,0.08);
          }
          .pulse-animation { animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite; }
          @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.7;} }
          .floating-orb { animation: float 2.1s ease-in-out infinite; }
          @keyframes float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-7px);} }
        `}
      </style>

      <div className="glass-card rounded-lg trading-glow p-3 flex flex-col h-full w-full relative group">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-green-400 via-emerald-500 to-teal-600 rounded-full shadow step-glow"></div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Execution Plan
              </h3>
              <div className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                Strategic Actions
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-green-400 rounded-full pulse-animation"></div>
              <div className="w-1 h-1 bg-yellow-400 rounded-full pulse-animation" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1 h-1 bg-red-400 rounded-full pulse-animation" style={{animationDelay: '0.6s'}}></div>
            </div>
            <div className="w-7 h-7 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700 floating-orb">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {list && list.length > 0 ? (
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-md p-4 border border-gray-700/30">
              <div className="space-y-1">
                {list.map((action: string, i: number) => (
                  <div
                    key={i}
                    className="action-card group/item flex items-start gap-2 p-2 rounded"
                  >
                    {/* Step number */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded flex items-center justify-center text-white font-bold text-xs shadow group-hover/item:scale-105 transition-all duration-200 border border-green-400/30">
                        {i + 1}
                      </div>
                      {i < list.length - 1 && (
                        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gradient-to-b from-green-400/40 to-transparent"></div>
                      )}
                    </div>
                    {/* Action text */}
                    <div className="flex-1 pt-0.5">
                      <div className="text-gray-200 font-medium leading-snug text-xs">
                        {action}
                      </div>
                      
                    </div>
                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center">
                      <div className="text-green-400 opacity-0 group-hover/item:opacity-100 transition-all duration-200 transform translate-x-1 group-hover/item:translate-x-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Summary bar */}
              <div className="mt-2 p-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded border border-gray-700/50">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    <span className="font-mono">TOTAL: {list.length}</span>
                  </div>
                  <div className="text-green-400 font-mono text-[11px]">
                    READY_TO_EXECUTE
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              {/* Success indicator */}
              <div className="relative mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg flex items-center justify-center mx-auto shadow border border-green-500/20">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full opacity-60 floating-orb"></div>
                <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-emerald-400 rounded-full opacity-40 floating-orb" style={{animationDelay: '0.7s'}}></div>
              </div>
              <div className="text-base font-bold text-gray-200 mb-1">Portfolio Optimized</div>
              <div className="text-gray-400 leading-relaxed text-xs max-w-[18rem] mx-auto mb-1.5">
                Strategy performing within optimal parameters. Continue monitoring.
              </div>
              {/* Trading metrics */}
              <div className="flex justify-center gap-2 mt-2">
                <div className="text-center">
                  <div className="text-green-400 font-mono text-[11px]">STATUS</div>
                  <div className="text-[11px] text-gray-500">OPTIMAL</div>
                </div>
                <div className="w-px h-4 bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-blue-400 font-mono text-[11px]">SIGNAL</div>
                  <div className="text-[11px] text-gray-500">HOLD</div>
                </div>
                <div className="w-px h-4 bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-yellow-400 font-mono text-[11px]">RISK</div>
                  <div className="text-[11px] text-gray-500">LOW</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-sm"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-teal-400/15 to-cyan-500/15 rounded-full blur-sm"></div>
        <div className="absolute top-2 right-2 flex gap-0.5 opacity-30 group-hover:opacity-60 transition-opacity duration-200">
          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
        </div>
      </div>
    </>
  );
};

export default PlanOfAction;
