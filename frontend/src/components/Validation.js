import React, { useState } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ValidationKPIs from "./ValidationKPIs";
import { BACKEND_URL } from "../utils/backend";
import { apiCall } from "../utils/api";

function Validation() {
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const handleRunWorkflow = async () => {
    setRunning(true);
    setRunMsg("");
    try {
      const data = await apiCall("/run-validation", { method: "POST" });
      setRunMsg(data.status === "success" ? "Validation workflow completed successfully!" : "Workflow failed.");
      setRefresh(r => r + 1); // trigger refresh
    } catch (e) {
      setRunMsg("Error running workflow.");
    }
    setRunning(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      py: 2
    }}>
      {/* Header Section */}
      <Card sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        mb: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e8eaed'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ flex: 1, minWidth: '300px' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#1a1a1a', 
                  fontWeight: 600,
                  mb: 1,
                  fontFamily: '"Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              >
                Discrepancy Validator
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#5f6368', 
                  fontWeight: 400,
                  fontFamily: '"Segoe UI", Roboto, sans-serif',
                  fontSize: '15px',
                  lineHeight: 1.6
                }}
              >
                AI-powered financial discrepancy detection, intelligent reason validation, and cost recovery opportunity analysis
              </Typography>
            </Box>
            
            <Button 
              variant="contained"
              onClick={handleRunWorkflow} 
              disabled={running}
              startIcon={<PlayCircleOutlineIcon />}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: '8px',
                px: 3,
                py: 1.5,
                fontFamily: '"Segoe UI", Roboto, sans-serif',
                fontWeight: 500,
                fontSize: '15px',
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
                  boxShadow: 'none'
                }
              }}
            >
              {running ? 'Running Analysis...' : 'Run Analysis'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {runMsg && (
        <Box sx={{ 
          backgroundColor: '#e8f5e9',
          border: '1px solid #81c784',
          borderRadius: '8px',
          p: 3,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <Typography sx={{ 
            color: '#2e7d32', 
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            fontWeight: 500, 
            fontSize: '15px'
          }}>
            ✓ {runMsg}
          </Typography>
        </Box>
      )}
      
      <ValidationKPIs refresh={refresh} />
    </Box>
  );
}

export default Validation;
