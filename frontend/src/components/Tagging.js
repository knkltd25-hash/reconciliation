import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import TaggingKPIs from "./TaggingKPIs";
import { BACKEND_URL } from "../utils/backend";

function Tagging() {
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const handleRunWorkflow = async () => {
    setRunning(true);
    setRunMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/run-tagging`, { method: "POST" });
      const data = await res.json();
      setRunMsg(data.status === "success" ? "Tagging workflow completed!" : "Workflow failed.");
      setRefresh(r => r + 1); // trigger refresh
    } catch (e) {
      setRunMsg("Error running workflow.");
    }
    setRunning(false);
  };

  return (
    <Box sx={{ 
      minHeight: '29vh',
      backgroundColor: '#f8f9fa',
      p: 3
    }}>
      {/* Header Section */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        p: 3,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        border: '1px solid #dadce0'
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#202124', 
              fontWeight: 400,
              mb: 0.5,
              fontFamily: 'Google Sans, Roboto, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            Potential Risk Flagger
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#5f6368', 
              fontWeight: 400,
              fontFamily: 'Google Sans, Roboto, sans-serif'
            }}
          >
            AI-Powered Transaction Risk Detection & Analysis
          </Typography>
        </Box>
        
        <Button 
          variant="contained"
          onClick={handleRunWorkflow} 
          disabled={running}
          sx={{
            backgroundColor: '#1a73e8',
            color: 'white',
            borderRadius: '4px',
            px: 3,
            py: 1,
            fontFamily: 'Google Sans, Roboto, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: '0 1px 2px rgba(60,64,67,.3), 0 1px 3px rgba(60,64,67,.15)',
            '&:hover': {
              backgroundColor: '#1557b0',
              boxShadow: '0 1px 3px rgba(60,64,67,.3), 0 4px 8px rgba(60,64,67,.15)'
            },
            '&:disabled': {
              backgroundColor: '#f8f9fa',
              color: '#5f6368',
              boxShadow: 'none'
            }
          }}
        >
          {running ? 'Running...' : 'Run Analysis'}
        </Button>
      </Box>
      
      {runMsg && (
        <Box sx={{ 
          backgroundColor: '#e6f4ea',
          border: '1px solid #c8e6c9',
          borderRadius: '4px',
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography sx={{ 
            color: '#137333', 
            fontFamily: 'Google Sans, Roboto, sans-serif',
            fontWeight: 400, 
            fontSize: '14px' 
          }}>
            ✓ {runMsg}
          </Typography>
        </Box>
      )}
      
      <TaggingKPIs refresh={refresh} />
    </Box>
  );
}

export default Tagging;
