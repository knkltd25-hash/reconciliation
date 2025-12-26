import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Toolbar, Chip } from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const options = [
  { key: "validation", label: "Discrepancy Validator" },
  { key: "chatbot", label: "Ask Me" },
];

function Sidebar({ selected, onSelect }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // Default to validation if needed
  if (!selected || selected === "tagging" || selected === "summary") {
    onSelect("validation");
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      background: '#fff', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
      borderBottom: '1px solid #eee',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 3,
        py: 1
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700, 
          color: "#000000",
          fontFamily: 'Google Sans, Roboto, sans-serif',
          letterSpacing: '-0.02em',
          ml: 2
        }}>
          {user?.role === "admin" ? "Reconciliation Admin" : "Reconciliation Assistant"}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {options.map((opt) => (
            <Button
              key={opt.key}
              variant={selected === opt.key ? "contained" : "text"}
              onClick={() => onSelect(opt.key)}
              size="medium"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: selected === opt.key ? 600 : 500,
                px: 2,
                py: 1,
                fontFamily: 'Google Sans, Roboto, sans-serif',
                fontSize: '14px',
                backgroundColor: selected === opt.key ? '#1976d2' : 'transparent',
                color: selected === opt.key ? '#fff' : '#5f6368',
                '&:hover': {
                  backgroundColor: selected === opt.key ? '#1565c0' : 'rgba(25, 118, 210, 0.08)',
                  color: selected === opt.key ? '#fff' : '#1976d2'
                }
              }}
            >
              {opt.label}
            </Button>
          ))}

          {user && (
            <>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mx: 2 }}>
                <Typography variant="body2" sx={{ color: '#5f6368' }}>
                  {user.username}
                </Typography>
                {user.role === "admin" && (
                  <Chip
                    label="Admin"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
              </Box>
              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                    borderColor: '#d32f2f'
                  }
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </Box>
  );
}

export default Sidebar;

