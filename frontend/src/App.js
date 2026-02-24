import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Chatbot from "./components/Chatbot";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import IssuesList from "./components/IssuesList";
import Settings from "./components/Settings";
import RiskAnalysis from "./components/RiskAnalysis";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { Box } from "@mui/material";

function DashboardLayout() {
  return (
    <Layout>
      <Routes>
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/dashboard" element={<AnalyticsDashboard />} />
        <Route path="/issues" element={<IssuesList />} />
        <Route path="/prediction" element={<RiskAnalysis />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
