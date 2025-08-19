import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [animatedText, setAnimatedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);
  
  const phrases = [
    "track your trades",
    "analyze performance",
    "identify patterns",
    "improve strategies",
    "reduce emotional trading",
    "boost consistency"
  ];

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        setAnimatedText(currentPhrase.substring(0, animatedText.length - 1));
        setTypingSpeed(75);
      } else {
        setAnimatedText(currentPhrase.substring(0, animatedText.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && animatedText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && animatedText === '') {
        setIsDeleting(false);
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
        setTypingSpeed(500);
      }
    };

    const typingTimer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(typingTimer);
  }, [animatedText, currentPhraseIndex, isDeleting, phrases, typingSpeed]);

  const navigateToJournal = () => {
    navigate('/signup');
  };

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-1 bg-blue-500 rounded-full animate-float1"></div>
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float2"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-300 rounded-full animate-float3"></div>
        <div className="absolute bottom-0 right-0 w-1 h-1 bg-blue-500 rounded-full animate-float4"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Revolutionize Your Trading With
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Smart Journaling
          </span>
        </h1>

        <div className="h-20 md:h-24">
          <p className="text-xl md:text-3xl text-blue-200 font-mono mb-8">
            A trade journal helps you <span className="text-cyan-300 border-r-2 border-cyan-300">{animatedText}</span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-blue-100 text-lg md:text-xl mb-12">
          <p className="mb-4">
            Every successful trader knows: consistent profits come from consistent tracking. 
            Our intelligent journal transforms raw data into actionable insights, helping you 
            eliminate costly mistakes and repeat winning strategies.
          </p>
          <p>
            Imagine knowing exactly why you win and why you lose - with AI-powered analysis 
            and beautiful visualizations that reveal your true trading habits.
          </p>
        </div>

        <button 
          onClick={navigateToJournal}
          className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white transition duration-300 ease-out border-2 border-cyan-400 rounded-full shadow-md group"
        >
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-cyan-500 group-hover:translate-x-0 ease">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
            Start Journaling Now
          </span>
          <span className="relative invisible">Start Journaling Now</span>
        </button>

        {/* Stats visualization */}
        
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-50px, -50px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, 50px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        .animate-float1 {
          animation: float1 15s ease-in-out infinite;
        }
        .animate-float2 {
          animation: float2 20s ease-in-out infinite;
        }
        .animate-float3 {
          animation: float3 25s ease-in-out infinite;
        }
        .animate-float4 {
          animation: float4 18s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;