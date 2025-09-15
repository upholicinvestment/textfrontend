import Navbar from "../../../src/components/layout/Navbar/Navbar";
import Footer from "../../components/layout/Footer/Footer";
import Orb from "../../Orb/Orb";
// import PriceScroll from "../PriceScroll/PriceScroll";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0a0b2a] relative overflow-x-hidden">
      {/* Sticky Navbar at top (in flow) */}
      <Navbar />

      {/* Ticker just below navbar */}
      {/* <div className="mt-1"> */}
      {/* <PriceScroll /> */}
      {/* </div> */}

      {/* <div className=" inset-0 -z-10 pointer-events-none"> */}
      <Orb />
      {/* </div> */}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
