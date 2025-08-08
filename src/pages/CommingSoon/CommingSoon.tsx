import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import upholictech from "../../assets/upholictech_icon.png";

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-white/20 rounded-full h-2">
    <div
      className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const ComingSoon = () => {
  const navigate = useNavigate();
  const progress = 75;

  const calculateTimeLeft = () => {
    const targetDate = new Date("2025-08-31");
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        {/* Close Button - positioned inside the white container */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close and return to home"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="md:flex h-full">
          {/* Left side - Visual */}
          <div className="md:w-2/5 bg-gradient-to-br from-blue-700 to-blue-900 p-12 flex flex-col">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mr-3 backdrop-blur-sm">
                <img
                  src={upholictech}
                  alt="UpholicTech Logo"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <span className="text-2xl font-semibold text-white">
                UpholicTech
              </span>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              <h3 className="text-4xl font-bold text-white mb-6 leading-tight">
                Revolutionizing{" "}
                <span className="text-blue-200">Your Stock Market</span> Journey
              </h3>
              <p className="text-sm text-blue-100 mb-8">
                Our next-gen trading platform is coming soon — built to empower
                traders with powerful tools, real-time data, and smarter
                strategies.
              </p>

              <div className="mb-10">
                <div className="flex justify-between text-sm font-medium text-blue-200 mb-2">
                  <span>Development Progress</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar progress={progress} />
              </div>

              {/* <div className="flex space-x-5">
                <a
                  href="#"
                  className="text-white hover:text-blue-200 transition-colors"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-white hover:text-blue-200 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div> */}
            </div>
          </div>

          {/* Right side - Content */}
          <div className="md:w-3/5 p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Launching Soon
              </h2>
              <p className="text-gray-600 mb-8">
                Be the first to know when we go live. Join our exclusive waiting
                list for early access.
              </p>

              <div className="grid grid-cols-4 gap-3 mb-10">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <div key={unit} className="text-center">
                    <div className="bg-gray-50 rounded-lg py-4 px-2">
                      <span className="text-3xl font-bold text-blue-600 block">
                        {value.toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500 mt-1 block">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;