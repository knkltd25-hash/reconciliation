import React from "react";
import { Box, Typography, Button, Toolbar } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

const options = [
  { key: "tagging", label: "Potential Risk Flagger" },
  { key: "validation", label: "Discrepancy Validator" },
];
const userGuideOption = { key: "summary", label: "i", icon: <InfoIcon /> };

function Sidebar({ selected, onSelect }) {
  const allOptions = [...options, userGuideOption];
  
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
          color: "#1976d2",
          fontFamily: 'Google Sans, Roboto, sans-serif',
          letterSpacing: '-0.02em',
          ml: 2
        }}>
          Reconciliation Assistant
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          
          {/* User Guide with Info Icon */}
          <Button
            key={userGuideOption.key}
            variant={selected === userGuideOption.key ? "contained" : "text"}
            onClick={() => onSelect(userGuideOption.key)}
            size="medium"
            sx={{
              borderRadius: '50%',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              p: 0,
              fontFamily: 'Google Sans, Roboto, sans-serif',
              backgroundColor: selected === userGuideOption.key ? '#1976d2' : 'transparent',
              color: selected === userGuideOption.key ? '#fff' : '#5f6368',
              '&:hover': {
                backgroundColor: selected === userGuideOption.key ? '#1565c0' : 'rgba(25, 118, 210, 0.08)',
                color: selected === userGuideOption.key ? '#fff' : '#1976d2'
              }
            }}
          >
            <InfoIcon fontSize="medium" />
          </Button>
        </Box>
      </Toolbar>
    </Box>
  );
}

export default Sidebar;
