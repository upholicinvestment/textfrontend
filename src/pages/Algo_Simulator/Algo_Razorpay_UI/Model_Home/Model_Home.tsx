import React, { useState } from "react";
import { Link } from "react-router-dom";
import Orb from "../../../../Orb/Orb";
import {
  FiCpu,
  FiBarChart2,
  FiTrendingUp,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import "./Model_Home.css";

type ModelKey = "pro" | "swing" | "starter";

interface ModelData {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string;
  buttonText: string;
  actionText: string;
  color: string;
  route: string;
}

const Model_Home = () => {
  const [activeModel, setActiveModel] = useState<ModelKey>("pro");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const models: Record<ModelKey, ModelData> = {
    pro: {
      title: "Option Scalper PRO",
      description: "AI-powered intraday trading engine",
      icon: <FiCpu className="text-white text-xl" />,
      details:
        "Our most advanced scalping system identifies micro-movements in options pricing with 92.7% accuracy. The algorithm processes 27 market indicators simultaneously, executing trades in 0.003s average latency. Features include dynamic stop-loss adjustment, volatility filters, and liquidity detection to maximize gains on 1-5 minute timeframes.",
      buttonText: "Launch Scalper",
      actionText: "Trade",
      color: "from-purple-500/20 to-blue-500/20",
      route: "/signup"
    },
    swing: {
      title: "Swing Trader Master",
      description: "Smart pattern recognition system",
      icon: <FiBarChart2 className="text-white text-xl" />,
      details:
        "Identifies high-probability swing trades with 3:1+ risk/reward ratios by analyzing fractal patterns across 9 timeframes. The system tracks 14 technical indicators and incorporates sentiment analysis to predict 3-10 day movements. Includes automated position sizing, trend confirmation filters, and smart alert system for optimal entry/exit points.",
      buttonText: "Analyze Markets",
      actionText: "Scan",
      color: "from-purple-500/20 to-blue-500/20",
      route: "/signup"
    },
    starter: {
      title: "Starter Scalping Suite",
      description: "Beginner-friendly trading system",
      icon: <FiTrendingUp className="text-white text-xl" />,
      details:
        "Simplified scalping interface with guided trades, educational tips, and protected risk management. Features include: pre-filtered opportunities, one-click trading, real-time coaching, and automatic position sizing (max 2% risk). Perfect for developing trading discipline while learning advanced techniques with 78% less volatility than standard strategies.",
      buttonText: "Begin Trading",
      actionText: "Start",
      color: "from-purple-500/20 to-blue-500/20",
      route: "/signup"
    },
  };

  const handleModelHover = (modelKey: ModelKey) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveModel(modelKey);

    setTimeout(() => {
      setShowInfoPanel(true);
      setIsAnimating(false);
    }, 50);
  };

  const currentModel = models[activeModel];

  return (
    <div className="model-home">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="particles"></div>
      </div>

      {/* Central Orb */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-[600px] z-10">
        <Orb
          hoverIntensity={2}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
      </div>

      {/* Model Cards */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-4xl">
        {/* Top Model - PRO */}
        <Link 
          to={models.pro.route}
          className="block mx-auto w-64 mb-16"
          onMouseEnter={() => handleModelHover("pro")}
          onMouseLeave={() => setShowInfoPanel(false)}
        >
          <div
            className={`model-card bg-gradient-to-br ${
              models.pro.color
            } backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg transition-all duration-500 cursor-pointer hover:shadow-xl hover:scale-105 ${
              activeModel === "pro" && showInfoPanel
                ? "ring-2 ring-blue-400/50"
                : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="p-3 rounded-xl bg-white/10 mb-3 hover:scale-110 transition-transform">
                {models.pro.icon}
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {models.pro.title}
              </h3>
              <p className="text-white/70 text-center text-sm mb-4">
                {models.pro.description}
              </p>
              <div className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2 group">
                {models.pro.actionText}
                <FiChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>

        <div className="flex justify-center gap-12 -mt-8">
          {/* Left Model - Swing */}
          <Link 
            to={models.swing.route}
            className="block w-56"
            onMouseEnter={() => handleModelHover("swing")}
            onMouseLeave={() => setShowInfoPanel(false)}
          >
            <div
              className={`model-card bg-gradient-to-br ${
                models.swing.color
              } backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg transition-all duration-500 cursor-pointer hover:shadow-xl hover:scale-105 ${
                activeModel === "swing" && showInfoPanel
                  ? "ring-2 ring-amber-400/50"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-xl bg-white/10 mb-3 hover:scale-110 transition-transform">
                  {models.swing.icon}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {models.swing.title}
                </h3>
                <p className="text-white/70 text-center text-sm mb-4">
                  {models.swing.description}
                </p>
                <div className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2 group">
                  {models.swing.actionText}
                  <FiChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>

          {/* Right Model - Starter */}
          <Link 
            to={models.starter.route}
            className="block w-56"
            onMouseEnter={() => handleModelHover("starter")}
            onMouseLeave={() => setShowInfoPanel(false)}
          >
            <div
              className={`model-card bg-gradient-to-br ${
                models.starter.color
              } backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg transition-all duration-500 cursor-pointer hover:shadow-xl hover:scale-105 ${
                activeModel === "starter" && showInfoPanel
                  ? "ring-2 ring-emerald-400/50"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-xl bg-white/10 mb-3 hover:scale-110 transition-transform">
                  {models.starter.icon}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {models.starter.title}
                </h3>
                <p className="text-white/70 text-center text-sm mb-4">
                  {models.starter.description}
                </p>
                <div className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2 group">
                  {models.starter.actionText}
                  <FiChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Panel */}
      {(() => {
        const isLeft = activeModel === "swing";
        return (
          <div
            className={`fixed top-[60%] transform -translate-y-1/2 z-50 w-80 transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]
              ${isLeft ? "left-6" : "right-6"}
              ${
                showInfoPanel
                  ? "opacity-100 translate-x-0"
                  : isLeft
                  ? "opacity-0 -translate-x-10 pointer-events-none"
                  : "opacity-0 translate-x-10 pointer-events-none"
              }`}
          >
            <div
              className={`model-card bg-gradient-to-b ${currentModel.color} backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl transition-all duration-700 h-[500px] overflow-hidden relative`}
            >
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-white/30 to-transparent pointer-events-none">
                <div className="w-full h-full rounded-xl bg-gray-900/80 backdrop-blur-sm"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-white/10 hover:scale-110 transition-transform">
                    {currentModel.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {currentModel.title}
                    </h2>
                    <p className="text-white/70 text-sm">
                      {currentModel.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-4 flex-grow overflow-y-auto custom-scroll">
                  <p className="text-white/80 text-sm leading-relaxed animate-text-in pr-2">
                    {currentModel.details}
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Model_Home;