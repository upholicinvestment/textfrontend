import Navbar from '../../../components/layout/Navbar/Navbar'
import Hero from './Hero'
import FnoKhazanaIntro from './FnoKhazanaIntro'
import Footer from '../../../components/layout/Footer/Footer'
import FnoIntroStoryrail from './FnoIntroStoryrail'
// import FnoLiveHighlights from './FnoLiveHighlights'

const Main = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
        <Navbar/>
        <Hero/>
        <FnoKhazanaIntro/>
        <FnoIntroStoryrail/>
        <Footer/>
    </div>
  )
}

export default Main