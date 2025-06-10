import React, { useState, useEffect, useRef } from 'react';
import AppRoutes from './routes/AppRoutes';
import './App.css';

const App: React.FC = () => {
  const [showFlash, setShowFlash] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [isPositive, setIsPositive] = useState(true);
  const loadingComplete = useRef(false);

  // Simulate loading progress
  useEffect(() => {
    const totalSteps = 20;
    let currentStep = 0;

    const loadNextStep = () => {
      if (currentStep >= totalSteps) {
        loadingComplete.current = true;
        return;
      }

      currentStep++;
      const newProgress = Math.min((currentStep / totalSteps) * 100, 100);
      setPercentage(newProgress);
      
      // Randomly determine if the trend is positive or negative
      if (currentStep % 5 === 0) {
        setIsPositive(Math.random() > 0.5);
      }

      const delay = 50 + (200 * (currentStep / totalSteps));
      setTimeout(loadNextStep, delay);
    };

    loadNextStep();

    return () => {
      loadingComplete.current = true;
    };
  }, []);

  // Transition to main app when loading completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (percentage >= 100 || loadingComplete.current) {
        setShowFlash(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  if (!showFlash) {
    return <AppRoutes />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
      <div className="text-center p-6 max-w-md w-full animate-fade-in">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4">
          {/* Animated loading bars with green/red colors */}
          <div className="h-16 bg-gray-700/50 rounded-lg mb-3 flex items-end overflow-hidden relative z-10">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 mx-0.5 ${i % 6 === 0 ? 'bg-blue-400' : isPositive ? 'bg-green-400' : 'bg-red-400'} rounded-t-sm`}
                style={{
                  height: `${Math.random() * 80 + 10}%`,
                  opacity: 0.8 - (i * 0.02),
                  animation: `grow ${0.5 + (i * 0.05)}s ease-out forwards`
                }}
              />
            ))}
          </div>
          <p className="text-white mt-4">
            Loading... {Math.round(percentage)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;