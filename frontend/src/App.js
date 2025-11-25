import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import TemplateGenerator from './components/TemplateGenerator';
import AdminPanel from './components/AdminPanel';
import './App.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (adminOnly && (!user || !user.is_admin)) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/template-generator" element={<TemplateGenerator />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminPanel />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/template-generator" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
