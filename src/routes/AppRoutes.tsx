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

// import NotFound from '../pages/404';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home/>} />
        <Route path="/fno-khazana" element={<Layout/>} />
        <Route path='/fii-dii-activity' element={<Fii_Dii_Activity/>} />
        <Route path='/fii-dii-fno' element={<Fii_Dii_Fno/>} />
        <Route path='/dii-index-opt' element={<Dii_Index_Opt/>} />
        <Route path='/pro-index-opt' element={<Pro_OI_Index_Opt/>} />
        <Route path='/client-index-opt' element={<Client_Index_Opt />} />
        <Route path='/summary' element={<Summary/>} />
        <Route path='/main-fii-dii' element={<Main_Page_Fii_Dii/>} />
        <Route path='/comming-soon' element={<ComingSoon/>}></Route>
        
        {/* <Route path="*" element={<NotFound />} /> */}

        <Route element={<GuestRoute/>}>
          <Route path='/login' element={<Login/>} />
          <Route path='/signup' element={<Register/>} />
        </Route>

        <Route element={<ProtectedRoute/>}>
            <Route path='/dashboard' element={<Dashboard/>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
