import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Upload from "./Upload";

import Recommendations from "./Recommendations";

import SoilAnalysisReport from "./SoilAnalysisReport";

import MyRecords from "./MyRecords";

import DataPipeline from "./DataPipeline";

import Profile from "./Profile";

import FieldVisualization from "./FieldVisualization";

import Analytics from "./Analytics";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Upload: Upload,
    
    Recommendations: Recommendations,
    
    SoilAnalysisReport: SoilAnalysisReport,
    
    MyRecords: MyRecords,
    
    DataPipeline: DataPipeline,
    
    Profile: Profile,
    
    FieldVisualization: FieldVisualization,
    
    Analytics: Analytics,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Recommendations" element={<Recommendations />} />
                
                <Route path="/SoilAnalysisReport" element={<SoilAnalysisReport />} />
                
                <Route path="/MyRecords" element={<MyRecords />} />
                
                <Route path="/DataPipeline" element={<DataPipeline />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/FieldVisualization" element={<FieldVisualization />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}