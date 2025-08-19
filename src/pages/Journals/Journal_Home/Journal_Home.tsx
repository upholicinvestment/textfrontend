import HeroSection from './HeroSection'
import WhatWeDo from './WhatWeDo';
import StatsSection from './StatsSection';
import FAQSection from './FAQSection';

import TestimonialSection from './TestimonialSection';

import Navbar from '../../../components/layout/Navbar/Navbar';
// import PriceScroll from '../../PriceScroll/PriceScroll';
const Journal_Home = () => {
  return (
    <div className="bg-white text-gray-900">
      <Navbar />

          {/* Fixed PriceScroll */}
          {/* <div className="fixed top-16 left-0 w-full z-10">
            <PriceScroll />
          </div> */}
      <HeroSection />
      <WhatWeDo />
      <StatsSection />
      <FAQSection />
      <TestimonialSection />
      
    </div>
  );
};

export default Journal_Home;