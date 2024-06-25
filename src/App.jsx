
import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from './global/Topbar';
import Sidebar from './global/Sidebar';
import Dashboard from './scenes/dashboard';
import Residents from './scenes/residents';
import Specialties from './scenes/specialties';
import LoginForm from './scenes/loginForm';
import Payments from './scenes/payments';
import Rappels from './scenes/rappel';

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          {!isAuthenticated ? (
            <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            <Router>
              <Sidebar isCollapsed={isSidebar} setIsCollapsed={setIsSidebar} />
              <div className={`content ${isSidebar ? 'collapsed' : ''}`}>
                <Topbar setIsSidebar={setIsSidebar} />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/residents" element={<Residents />} />
                    <Route path="/specialties" element={<Specialties />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/rappels" element={<Rappels />} />

                  </Routes>
                </main>
              </div>
            </Router>
          )}
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
