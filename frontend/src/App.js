import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Validation from "./components/Validation";
import Chatbot from "./components/Chatbot";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { Box } from "@mui/material";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [selected, setSelected] = useState("validation");
  const [workflowRun, setWorkflowRun] = useState(false);

  const handleSidebarSelect = (option) => {
    setSelected(option);
  };

  const handleWorkflowRun = () => {
    setWorkflowRun(true);
    setTimeout(() => setWorkflowRun(false), 2000);
  };

  // Show AdminDashboard for admin users
  if (user?.role === "admin") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Sidebar selected="admin" onSelect={() => {}} />
        <Box sx={{ flex: 1, p: 0, background: "#f7f8fa", overflowY: 'auto' }}>
          <AdminDashboard />
        </Box>
      </Box>
    );
  }

  // Regular user dashboard
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Sidebar selected={selected} onSelect={handleSidebarSelect} />
      <Box sx={{ flex: 1, p: selected === "chatbot" ? 0 : 3, background: "#f7f8fa", overflowY: 'auto' }}>
        {selected === "validation" && <Validation />}
        {selected === "chatbot" && <Chatbot />}
      </Box>
    </Box>
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
