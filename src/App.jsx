import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from './global/Topbar';
import Sidebar from './global/Sidebar';
import Dashboard from './scenes/dashboard';
import Residents from './scenes/residents';
import Specialties from './scenes/specialties';
import DbForm from './scenes/dbForm';
import LoginForm from './scenes/loginForm';
import { invoke } from '@tauri-apps/api/tauri';
import Payments from './scenes/payments';
import Banks from './scenes/payments';

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [records, setRecords] = useState([]);

  const listRecords = async () => {
    try {
      const result = await invoke('list_record');
      setRecords(result);
    } catch (error) {
      alert('Failed to list records');
      console.error('Error:', error);
    }
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          {!isConnected ? (
            <DbForm onConnect={() => setIsConnected(true)} />
          ) : !isAuthenticated ? (
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
                    <Route path="/payments" element={<Banks />} />
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
