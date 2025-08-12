import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import './App.css';

// Placeholder components for now
const Home = React.lazy(() => import('./pages/Home'));
const DailyBrief = React.lazy(() => import('./pages/DailyBrief'));
const FundingDetail = React.lazy(() => import('./pages/FundingDetail'));

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/daily-brief" element={<DailyBrief />} />
            <Route path="/funding/:fundingUuid" element={<FundingDetail />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
