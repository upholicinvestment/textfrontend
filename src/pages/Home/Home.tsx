import Navbar from "../../../src/components/layout/Navbar/Navbar";
import Model_Home from "../Algo_Simulator/Algo_Razorpay_UI/Model_Home/Model_Home";
import PriceScroll from "../PriceScroll/PriceScroll";

const Home = () => {
  return (
    <div className="relative min-h-screen bg-[#0a0b2a]">
      <Navbar />
      
      {/* Fixed PriceScroll - Adjusted to account for Navbar height */}
      <div className="fixed top-16 left-0 w-full z-30 bg-[#0a0b2a] border-b border-purple-500/20">
        <PriceScroll />
      </div>

      {/* Main content with proper spacing */}
      <main className="pt-32 pb-10 min-h-screen"> {/* Increased pt to account for both Navbar and PriceScroll */}
        <Model_Home />
      </main>
    </div>
  );
};

export default Home;