// src/routes/AppRoutes.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

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
import ContactUs from '../pages/Policies/ContactUs';
import Algo_Similator_Home from '../pages/Algo_Simulator/Algo_Home/Algo_Similator_Home';
import FiiDiiHome from '../pages/Fii_Dii/Fii_Dii_Home/FiiDiiHome';
// import NotFound from '../pages/404';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/fno-khazana" element={<Layout />} />
        <Route path="/fii-dii-activity" element={<Fii_Dii_Activity />} />
        <Route path="/fii-dii-fno" element={<Fii_Dii_Fno />} />
        <Route path="/dii-index-opt" element={<Dii_Index_Opt />} />
        <Route path="/pro-index-opt" element={<Pro_OI_Index_Opt />} />
        <Route path="/client-index-opt" element={<Client_Index_Opt />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/main-fii-dii" element={<Main_Page_Fii_Dii />} />
        <Route path="/comming-soon" element={<ComingSoon />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/terms" element={<OurTerms />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundCancellationPolicy />} />
        <Route path="/pricing" element={<Price />} />
        <Route path="/about" element={<About />} />
        <Route path="/journaling" element={<Journal_Home />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/algo-simulator" element={<Algo_Similator_Home />} />
        <Route path='/fii-dii-fno-home' element={<FiiDiiHome/>} />

        {/* Guest-only: login & signup.
            NOTE: Updated GuestRoute allows logged-in users to access /signup
            when it's used as a checkout page (e.g., ?productKey=... or mode=purchase). */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
        </Route>

        {/* Auth-only routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lauching-soon" element={<ComeSoon />} />
          <Route path="/journal" element={<Journal_Layout />} />

          {/* ✅ New: dedicated checkout path for logged-in purchases.
              You can link to /checkout?productKey=...&variantKey=...
              This renders the same Register/Checkout component in "logged-in purchase" mode. */}
          <Route path="/checkout" element={<Register />} />
        </Route>

        {/* Optionally add a 404 route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
