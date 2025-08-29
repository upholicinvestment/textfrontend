import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VIDEO_SRC = 'https://cdn.pixabay.com/video/2019/03/19/22098-325253535_large.mp4';

const HeroSection = () => {
  const navigate = useNavigate();
  const [animatedText, setAnimatedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = [
    'track your trades',
    'analyze performance',
    'identify patterns',
    'improve strategies',
    'reduce emotional trading',
    'boost consistency'
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
        setTimeout(() => setIsDeleting(true), 1200);
      } else if (isDeleting && animatedText === '') {
        setIsDeleting(false);
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
        setTypingSpeed(450);
      }
    };

    const typingTimer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(typingTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatedText, currentPhraseIndex, isDeleting, typingSpeed]);

  const navigateToJournal = () => {
    navigate('/journal');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Optional subtle gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-3">
          TradeKhata
        </h1>
        <p className="text-cyan-300/90 text-lg md:text-2xl font-medium mb-8">
          Smart Trading Journal — built for real traders
        </p>

        <div className="h-16 md:h-20 mb-8">
          <p className="text-xl md:text-3xl text-blue-100/90 font-mono">
            A trade journal helps you{' '}
            <span className="text-cyan-300 border-r-2 border-cyan-300 pr-1">
              {animatedText}
            </span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto text-blue-100/95 text-base md:text-lg mb-12 leading-relaxed">
          <p className="mb-4">
            Track. Analyze. Improve. TradeKhata turns raw order data into
            crystal-clear insights—win-rate, R:R, equity curve, good vs bad
            trades, and habits that actually move your PnL.
          </p>
          <p>
            Trade with discipline, not guesswork. Let your data tell the story.
          </p>
        </div>

        <button
          onClick={navigateToJournal}
          className="relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-semibold text-white transition duration-300 ease-out border-2 border-cyan-400 rounded-full shadow-md group"
        >
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-cyan-500 group-hover:translate-x-0 ease">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
            Start Journaling Now
          </span>
          <span className="relative invisible">Start Journaling Now</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
