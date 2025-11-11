// src/routes/AppRoutes.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from '../pages/Home/Home';
import AdminDashboard from '../pages/Admin/AdminDashboard';

import Layout from '../pages/FNO_Home/Layout/Layout';
// import Main from '../pages/FNO_Home/Fno_Homepage/Main';
// import ScannerDashboard from '../pages/Fundamental_Scanner/Scanner_Dashboard/ScannerDashboard';
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
import MyProfile from '../pages/Myprofile/Myprofile';
import RequireEntitlement from './RequireEntitlement'; // ⬅️ NEW
import Support from '../pages/Policies/Support';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* <Route path="/fno-khazana" element={<Main/>} /> */}
        <Route path="/fii-dii-activity" element={<Fii_Dii_Activity />} />
        <Route path="/fii-dii-fno" element={<Fii_Dii_Fno />} />
        <Route path="/dii-index-opt" element={<Dii_Index_Opt />} />
        <Route path="/pro-index-opt" element={<Pro_OI_Index_Opt />} />
        <Route path="/client-index-opt" element={<Client_Index_Opt />} />
        <Route path="/summary" element={<Summary />} />
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
        <Route path='/fii-dii-fno-home' element={<FiiDiiHome/>} />
        <Route path='/support' element={<Support/>} />
        {/* <Route path="/fundamental-scanner" element={<ScannerDashboard />} /> */}
        {/* Guest-only: login & signup (keeps your purchase allowance logic) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
        </Route>

        {/* Auth-only routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lauching-soon" element={<ComeSoon />} />
          <Route path='/profile' element={<MyProfile/>} />

          {/* Journal → needs journaling (bundle component) OR journaling_solo */}
          <Route element={<RequireEntitlement anyOf={["journaling", "journaling_solo"]} />}>
            <Route path="/journal" element={<Journal_Layout />} />
          </Route>

          {/* FII/DII → key=fii_dii_data (part of your bundle components) */}
          <Route element={<RequireEntitlement anyOf={["fii_dii_data"]} />}>
            <Route path="/main-fii-dii" element={<Main_Page_Fii_Dii />} />
          </Route>

          <Route element={<RequireEntitlement anyOf={["fno_khazana"]} />}>
             <Route path="/fno" element={<Layout />} />
          </Route>

          {/* Logged-in purchase flow still allowed */}
          <Route path="/checkout" element={<Register />} />
        </Route>

        {/* Add 404 if you want */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
