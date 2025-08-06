import Navbar from "../../../src/components/layout/Navbar/Navbar";
import Model_Home from "../Algo_Simulator/Algo_Razorpay_UI/Model_Home/Model_Home";
import PriceScroll from "../PriceScroll/PriceScroll";

const Home = () => {
  return (
    <>
      <Navbar />
      
      {/* Fixed PriceScroll */}
      <div className="fixed top-16 left-0 w-full z-30 bg-[#0a0b2a]">
        <PriceScroll />
      </div>

      {/* Main content with proper spacing */}
      <main className="pt-29 pb-10 min-h-screen"> {/* Use standard Tailwind classes */}
        <Model_Home />
      </main>
    </>
  );
};

export default Home;