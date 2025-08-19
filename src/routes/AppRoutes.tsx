// src/routes/AppRoutes.tsx
import React, {Suspense} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';

// Intro 3D pieces
import SplashCursor from '../pages/Intro3D/Splashcolour';
import LightRays from '../pages/Intro3D/Background';
import RobotModel from '../pages/Intro3D/Robot';
import TickerBanner from '../pages/Intro3D/Text';
import RightPanel from '../pages/Intro3D/RightPanel';

// Import your components/pages
import Home from '../pages/Home/Home';
import Layout from '../pages/FNO_Home/Layout/Layout';
import Fii_Dii_Activity from '../pages/Fii_Dii/Fii_Dii/Fii_Dii_Activity';
import Fii_Dii_Fno from '../pages/Fii_Dii/Fii_Dii/Fii_Dii_Fno';
import Dii_Index_Opt from '../pages/Fii_Dii/Dii_Index/Dii_Index_Opt';
import Pro_OI_Index_Opt from '../pages/Fii_Dii/Pro_OI_Index/Pro_OI_Index_Opt';
import Client_Index_Opt from '../pages/Fii_Dii/Client_Index/Client_Index_Opt';
import Summary from '../pages/Fii_Dii/Summary/Summary';
import Main_Page_Fii_Dii from '../pages/Fii_Dii/Main_Page_Fii_Dii/Main_Page_Fii_Dii';
import Login from '../components/features/Auth/Login';
import Register from '../components/features/Auth/Register';
import Dashboard from '../components/dashboard/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import ComingSoon from '../pages/CommingSoon/CommingSoon';
import ForgetPassword from '../components/features/Auth/ForgetPassword';
import ComeSoon from '../pages/CommingSoon/ComeSoon';
import OurTerms from '../pages/Policies/OurTerms';
import PrivacyPolicy from '../pages/Policies/PrivacyPolicy';
import RefundCancellationPolicy from '../pages/Policies/RefundCancellationPolicy';
import Price from '../pages/Price/Price';
import About from '../pages/About/About';
import Journal_Home from '../pages/Journals/Journal_Home/Journal_Home';
import Journal_Layout from '../pages/Journals/JournalLayout/Journal_Layout';
// import NotFound from '../pages/404';

// ---------- Local wrapper for page transitions ----------
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.6 }}
    style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
    }}
  >
    {children}
  </motion.div>
);

// ---------- Inline Intro HomePage (3D splash) ----------
const HomePage: React.FC = () => (
  <PageWrapper>
    <SplashCursor />

    {/* Light Rays Background */}
    <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#eceeeeff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
        className="light-rays-container"
      />
    </div>

    {/* 3D Canvas */}
    <Canvas
      camera={{ position: [0, 2, 8], fov: 50 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        background: 'transparent',
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <Suspense fallback={null}>
        <RobotModel />
      </Suspense>

      <OrbitControls />
    </Canvas>

    {/* Right-side panel + ticker */}
    <RightPanel />
    <TickerBanner />

    <style>
      {`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}
    </style>
  </PageWrapper>
);


const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 3D splash/intro first */}
        <Route path='/' element={<HomePage />} />

        {/* Public routes */}
        <Route path="/Home" element={<Home/>} />
        <Route path="/fno-khazana" element={<Layout/>} />
        <Route path='/fii-dii-activity' element={<Fii_Dii_Activity/>} />
        <Route path='/fii-dii-fno' element={<Fii_Dii_Fno/>} />
        <Route path='/dii-index-opt' element={<Dii_Index_Opt/>} />
        <Route path='/pro-index-opt' element={<Pro_OI_Index_Opt/>} />
        <Route path='/client-index-opt' element={<Client_Index_Opt />} />
        <Route path='/summary' element={<Summary/>} />
        <Route path='/main-fii-dii' element={<Main_Page_Fii_Dii/>} />
        <Route path='/comming-soon' element={<ComingSoon/>}></Route>
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/terms" element={<OurTerms/>} />
        <Route path='/privacy' element={<PrivacyPolicy/>} />
        <Route path='/refund' element={<RefundCancellationPolicy/>}/>
        <Route path='/pricing' element={<Price/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/journaling' element={<Journal_Home/>} />
        
        {/* <Route path="*" element={<NotFound />} /> */}

        <Route element={<GuestRoute/>}>
          <Route path='/login' element={<Login/>} />
          <Route path='/signup' element={<Register/>} />
        </Route>

        <Route element={<ProtectedRoute/>}>
            <Route path='/dashboard' element={<Dashboard/>} />
            <Route path='/lauching-soon' element={<ComeSoon/>} />
            <Route path='/journal' element={<Journal_Layout/>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
