// src/pages/Home/Home.tsx  (or your current Home file)

import Navbar from "../../../src/components/layout/Navbar/Navbar";
import Footer from "../../components/layout/Footer/Footer";
import Orb from "../../Orb/Orb";
// import News from "./News";
// import PriceScroll from "../PriceScroll/PriceScroll";
import BundleWizard from "../../Orb/BundlePopup"

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
      {/* {<News/>} */}
      {/* Footer */}
      <Footer />

      {/* Bundle Popup (render once, overlays the page) */}
      <BundleWizard />
      {/* If you track entitlements, you can pass: <BundlePopup hasBundle={true} /> */}
    </div>
  );
};

export default Home;