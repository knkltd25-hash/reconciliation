import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Button, Divider, LinearProgress, Stack } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, ComposedChart } from "recharts";
import { AttachMoney as AttachMoneyIcon, ShowChart as ShowChartIcon, MonetizationOn as MonetizationOnIcon, Savings as SavingsIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { BACKEND_URL } from "../utils/backend";
import { apiCall } from "../utils/api";
import PenaltyTable from "./PenaltyTable";

const COLORS = ["#1976d2", "#43a047", "#fbc02d", "#e53935", "#8e24aa", "#00acc1"];

function ValidationKPIs({ refresh }) {
  const [validationData, setValidationData] = useState([]);
  const [reasonsData, setReasonsData] = useState([]);
  const [penaltyMetrics, setPenaltyMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState("");
  const [filterReason, setFilterReason] = useState("");
  const [filterPenalty, setFilterPenalty] = useState("");
  const [filterPOID, setFilterPOID] = useState("");
  const [reasonOptions, setReasonOptions] = useState([]);
  const [poOptions, setPoOptions] = useState([]);
  const [penaltyStats, setPenaltyStats] = useState({ p33: 0, p66: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {

        
        // Fetch validation results
        const validationRes = await fetch(`${BACKEND_URL}/results/final_reason_validation_results.csv`);
        const validationText = await validationRes.text();
        
        // Try to fetch from the new endpoint first
        let reasonsParsed = [];
        try {

          const allPenaltiesRes = await fetch(`${BACKEND_URL}/all-penalties`);
          if (allPenaltiesRes.ok) {
            const allPenaltiesData = await allPenaltiesRes.json();
            reasonsParsed = allPenaltiesData.penalties;

          } else {

            // Fallback to direct CSV file
            const reasonsRes = await fetch(`${BACKEND_URL}/results/reasons.csv`);
            const reasonsText = await reasonsRes.text();
            
            // Parse CSV
            const parseCSV = (csv) => {
              const [header, ...rows] = csv.trim().split(/\r?\n/);
              const keys = header.split(",");
              return rows.map(row => {
                const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
                const obj = {};
                keys.forEach((k, i) => obj[k] = values[i]);
                return obj;
              });
            };
            
            reasonsParsed = parseCSV(reasonsText);
          }
        } catch (error) {
          console.error("Error fetching penalties:", error);
          // Try direct CSV as last resort
          const reasonsRes = await fetch(`${BACKEND_URL}/results/reasons.csv`);
          const reasonsText = await reasonsRes.text();
          
          // Parse CSV
          const parseCSV = (csv) => {
            const [header, ...rows] = csv.trim().split(/\r?\n/);
            const keys = header.split(",");
            return rows.map(row => {
              const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
              const obj = {};
              keys.forEach((k, i) => obj[k] = values[i]);
              return obj;
            });
          };
          
          reasonsParsed = parseCSV(reasonsText);
        }
        
        // Parse validation data
        const parseCSV = (csv) => {
          const [header, ...rows] = csv.trim().split(/\r?\n/);
          const keys = header.split(",");
          return rows.map(row => {
            const values = row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
            const obj = {};
            keys.forEach((k, i) => obj[k] = values[i]);
            return obj;
          });
        };
        
        const validationParsed = parseCSV(validationText);
        
        // Make sure penalty values are treated as numbers
        const reasonsWithNumberPenalty = reasonsParsed.map(row => ({
          ...row,
          penalty: row.penalty ? parseFloat(row.penalty) : 0,
          // Normalize reason name for better matching
          reason_normalized: row.reason ? row.reason.trim().toLowerCase() : ''
        }));
        
        // Enhance validation data with normalized stated_reason
        const enhancedValidationData = validationParsed.map(row => ({
          ...row,
          stated_reason_normalized: row.stated_reason ? row.stated_reason.trim().toLowerCase() : ''
        }));
        
        setValidationData(enhancedValidationData);
        setReasonsData(reasonsWithNumberPenalty);
        
        // Fetch penalty metrics - this endpoint will use the existing penalty values
        const penaltyData = await apiCall("/calculate-penalties", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (penaltyData.status === 'success') {
          setPenaltyMetrics(penaltyData.metrics);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refresh]);

  // Load reason options and calculate penalty stats
  useEffect(() => {
    if (validationData.length > 0) {
      // Extract unique reasons from validation data
      const uniqueReasons = [...new Set(
        validationData
          .filter(row => row.stated_reason && row.stated_reason.trim())
          .map(row => row.stated_reason.trim())
      )].sort();
      setReasonOptions(uniqueReasons);

      // Calculate penalty percentiles
      const penalties = reasonsData
        .map(row => parseFloat(row.penalty || 0))
        .filter(p => !isNaN(p))
        .sort((a, b) => a - b);
      
      if (penalties.length > 0) {
        const p33Index = Math.floor(penalties.length * 0.33);
        const p66Index = Math.floor(penalties.length * 0.66);
        setPenaltyStats({
          p33: penalties[p33Index] || 0,
          p66: penalties[p66Index] || 0
        });
      }

      // Extract unique PO IDs from validation data
      const uniquePOs = [...new Set(
        validationData
          .filter(row => row.PO_ID && row.PO_ID.trim())
          .map(row => row.PO_ID.trim())
      )].sort();
      setPoOptions(uniquePOs);
    }
  }, [validationData, reasonsData]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress size={50} />
    </Box>
  );

  // KPI: Total Validations, Match/Not, Distribution
  const total = validationData.length;
  let match = 0, notMatch = 0;
  const reasonCounts = {};
  validationData.forEach((row) => {
    if (row["Match/Not"] === "True") match++;
    else if (row["Match/Not"] === "False") notMatch++;
    if (row.stated_reason) {
      const reason = row.stated_reason.trim();
      if (reason) reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  });
  const matchDist = [
    { name: "Match", value: match },
    { name: "Not Match", value: notMatch },
  ];
  const reasonDist = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

  // Filter out 'no reason' (case-insensitive)
  const filteredReasonDist = reasonDist.filter(r => r.name.trim().toLowerCase() !== "no reason");

  // Show only top 5 actionable reasons
  const topReasons = filteredReasonDist.slice().sort((a, b) => b.value - a.value).slice(0, 5);
  
  // Calculate penalty metrics
  const totalPenaltyAmount = penaltyMetrics?.total_penalty_claimed || 
    reasonsData.reduce((sum, row) => {
      const penalty = parseFloat(row.penalty || 0);
      return isNaN(penalty) ? sum : sum + penalty;
    }, 0);
    
  const saveablePenaltyAmount = penaltyMetrics?.penalty_that_can_be_saved ||
    validationData
      .filter(vRow => vRow["Match/Not"] === "False")
      .map(vRow => {
        const reasonRow = reasonsData.find(
          r => r.PO_ID === vRow.PO_ID && 
               r.reason && vRow.stated_reason &&
               r.reason.trim().toLowerCase() === vRow.stated_reason.trim().toLowerCase()
        );
        return reasonRow ? parseFloat(reasonRow.penalty || 0) : 0;
      })
      .reduce((sum, penalty) => sum + (isNaN(penalty) ? 0 : penalty), 0);
      
  // Calculate top reasons by penalty
  const topReasonsByPenalty = topReasons.map(reason => {
    const reasonPenalty = reasonsData
      .filter(item => 
        item.reason && reason.name && 
        item.reason.trim().toLowerCase() === reason.name.trim().toLowerCase()
      )
      .reduce((sum, item) => {
        const penalty = parseFloat(item.penalty || 0);
        return isNaN(penalty) ? sum : sum + penalty;
      }, 0);
      
    const saveable = validationData
      .filter(vRow => 
        vRow.stated_reason && reason.name &&
        vRow.stated_reason.trim().toLowerCase() === reason.name.trim().toLowerCase() && 
        vRow["Match/Not"] === "False"
      )
      .map(vRow => {
        const rRow = reasonsData.find(r => 
          r.PO_ID === vRow.PO_ID && 
          r.reason && vRow.stated_reason && 
          r.reason.trim().toLowerCase() === vRow.stated_reason.trim().toLowerCase()
        );
        return rRow ? parseFloat(rRow.penalty || 0) : 0;
      })
      .reduce((sum, penalty) => sum + (isNaN(penalty) ? 0 : penalty), 0);
      
    return {
      reason: reason.name,
      totalPenalty: reasonPenalty,
      saveable: saveable
    };
  });

  // Filtered rows based on selected PO (for backward compatibility)
  const filteredRows = selectedPO
    ? validationData.filter(row => row.PO_ID === selectedPO)
    : validationData;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* KPI Cards - Professional Grid Layout */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                bgcolor: '#ffffff', 
                border: '1px solid #e8eaed',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#5f6368',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Validations
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: '#1976d2',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 1.5
                  }}>
                    {total.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={100}
                    sx={{
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2',
                        borderRadius: '3px'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                bgcolor: '#ffffff', 
                border: '1px solid #e8eaed',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#5f6368',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Match Accuracy
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: '#2e7d32',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 0.5
                  }}>
                    {total ? ((match / total) * 100).toFixed(1) : 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={total ? (match / total) * 100 : 0}
                    sx={{
                      height: '3px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '2px',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2e7d32',
                        borderRadius: '2px'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                bgcolor: '#ffffff', 
                border: '1px solid #e8eaed',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#5f6368',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    POs with Discrepancy
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: '#d32f2f',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mb: 1.5
                  }}>
                    {notMatch.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={total ? (notMatch / total) * 100 : 0}
                    sx={{
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#d32f2f',
                        borderRadius: '3px'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                bgcolor: '#ffffff', 
                border: '1px solid #e8eaed',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#5f6368',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Top Discrepancy Reason
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#1976d2',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    lineHeight: 1.4,
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '40px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {topReasons.length > 0 ? topReasons[0].name : '-'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={topReasons.length > 0 ? (topReasons[0].value / total) * 100 : 0}
                    sx={{
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2',
                        borderRadius: '3px'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Financial Impact Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e3f2fd',
                borderRadius: '12px',
                backgroundColor: '#f3f7fd'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}>
                    Total Penalty Exposure
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    color: '#1976d2', 
                    fontWeight: 700,
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    ${penaltyMetrics?.total_penalty_claimed?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    display: 'block'
                  }}>
                    Across {validationData.length} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e8f5e9',
                borderRadius: '12px',
                backgroundColor: '#f1f8f4'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}>
                    Potential Cost Recovery
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 700,
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    ${penaltyMetrics?.penalty_that_can_be_saved?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    display: 'block'
                  }}>
                    From {notMatch} disputable transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #fff3e0',
                borderRadius: '12px',
                backgroundColor: '#fef9f0'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1
                  }}>
                    Recovery Opportunity Rate
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    color: '#f57c00', 
                    fontWeight: 700,
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    {penaltyMetrics?.percentage_saveable || '0'}%
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#5f6368', 
                    textAlign: 'center',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    fontSize: '12px',
                    display: 'block'
                  }}>
                    Of exposure recoverable
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        {/* Key Validation Insights - Side by Side Layout */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={2} sx={{ 
                fontWeight: 400, 
                color: '#202124',
                fontFamily: 'Google Sans, Roboto, sans-serif'
              }}>
                Key Validation Insights
              </Typography>
              <TableContainer component={Paper} sx={{ 
                boxShadow: '0 3px 10px rgba(0,0,0,0.08)', 
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                maxHeight: 220
              }}>
                <Table size="small" aria-label="validation insights">
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: '#f5f5f5', 
                      '& .MuiTableCell-head': { 
                        fontWeight: 'bold', 
                        color: '#1976d2',
                        fontSize: '0.9rem' 
                      } 
                    }}>
                      <TableCell sx={{ width: '25%' }}>Reason</TableCell>
                      <TableCell align="center" sx={{ width: '15%' }}>Count</TableCell>
                      <TableCell align="center" sx={{ width: '15%' }}>Accuracy</TableCell>
                      <TableCell align="right" sx={{ width: '20%' }}>Avg Penalty</TableCell>
                      <TableCell align="right" sx={{ width: '25%' }}>Total Impact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topReasons.slice(0, 5).map((r) => {
                      const matchCount = validationData.filter(row => 
                        row.stated_reason && 
                        row.stated_reason.trim().toLowerCase() === r.name.trim().toLowerCase() && 
                        row["Match/Not"] === "True"
                      ).length;
                      
                      const notMatchCount = validationData.filter(row => 
                        row.stated_reason && 
                        row.stated_reason.trim().toLowerCase() === r.name.trim().toLowerCase() && 
                        row["Match/Not"] === "False"
                      ).length;
                      
                      const total = matchCount + notMatchCount;
                      const matchRate = total ? (matchCount / total) * 100 : 0;
                      
                      // Get all penalties for this reason
                      const penaltyAmounts = reasonsData
                        .filter(item => 
                          item.reason && r.name && 
                          item.reason.trim().toLowerCase() === r.name.trim().toLowerCase()
                        )
                        .map(item => parseFloat(item.penalty || 0))
                        .filter(p => !isNaN(p));
                      
                      const totalPenalty = penaltyAmounts.reduce((sum, p) => sum + p, 0);
                      const avgPenalty = penaltyAmounts.length > 0 
                        ? totalPenalty / penaltyAmounts.length 
                        : 0;
                      
                      // Color code accuracy values
                      let accuracyColor = '#2E7D32';
                      if (matchRate < 70) accuracyColor = '#C62828';
                      else if (matchRate < 90) accuracyColor = '#EF6C00';
                      
                      // Color code by penalty amount
                      let penaltyColor = '#333333';
                      if (avgPenalty > 500) penaltyColor = '#C62828';
                      else if (avgPenalty > 200) penaltyColor = '#EF6C00';
                      
                      return (
                        <TableRow 
                          key={r.name} 
                          hover
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(25, 118, 210, 0.04)',
                              cursor: 'pointer'
                            },
                            borderLeft: `3px solid ${accuracyColor}`
                          }}
                        >
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={r.name}
                          >
                            {r.name}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            {total}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ 
                              display: 'inline-block',
                              bgcolor: `${accuracyColor}15`,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '12px',
                              minWidth: '50px'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: accuracyColor,
                                  fontSize: '0.85rem' 
                                }}
                              >
                                {matchRate.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: penaltyColor
                          }}>
                            ${avgPenalty.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: '#1976d2'
                          }}>
                            ${totalPenalty.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Top Discrepancy Drivers - Side by Side Layout */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={2} sx={{ 
                fontWeight: 400, 
                color: '#202124',
                fontFamily: 'Google Sans, Roboto, sans-serif'
              }}>
                Top Discrepancy Drivers
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={topReasons.map(r => {
                    // Calculate percentage from total validations
                    const percentage = ((r.value / total) * 100).toFixed(1);
                    
                    // Display shortened reason name for better readability
                    const shortenedName = r.name.length > 25 
                      ? r.name.substring(0, 23) + '...' 
                      : r.name;
                      
                    // Calculate avg penalty for this reason
                    const reasonPenalties = reasonsData
                      .filter(item => item.reason && r.name && 
                        item.reason.trim().toLowerCase() === r.name.trim().toLowerCase())
                      .map(item => parseFloat(item.penalty || 0))
                      .filter(p => !isNaN(p));
                    
                    const avgPenalty = reasonPenalties.length > 0
                      ? reasonPenalties.reduce((sum, p) => sum + p, 0) / reasonPenalties.length
                      : 0;
                    
                    return {
                      name: shortenedName,
                      fullName: r.name,
                      value: r.value,
                      percentage: parseFloat(percentage),
                      avgPenalty: avgPenalty
                    };
                  })} 
                  layout="vertical" 
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <XAxis 
                    type="number" 
                    allowDecimals={false}
                    label={{ value: 'Occurrence Count', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontWeight: 'bold', fill: '#333', fontSize: 12 }} 
                    width={150}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#5C6BC0" 
                    barSize={25}
                    radius={[0, 4, 4, 0]}
                    label={{ 
                      position: 'right', 
                      formatter: (value) => `${value} (${((value/total)*100).toFixed(1)}%)`,
                      fill: '#333',
                      fontSize: 12
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Occurrences']}
                    labelFormatter={(label) => {
                      const item = topReasons.find(r => {
                        const shortenedName = r.name.length > 25 
                          ? r.name.substring(0, 23) + '...' 
                          : r.name;
                        return shortenedName === label;
                      });
                      return item ? item.name : label;
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                            <p style={{ margin: 0 }}><b>{data.fullName}</b></p>
                            <p style={{ margin: 0 }}>{data.value} occurrences ({data.percentage}% of total)</p>
                            <p style={{ margin: 0 }}>Avg. Penalty: ${data.avgPenalty.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Financial Recovery and PO-wise Table Side by Side */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '8px', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={2} sx={{ 
                fontWeight: 400, 
                color: '#202124',
                fontFamily: 'Google Sans, Roboto, sans-serif'
              }}>
                Financial Recovery Opportunity by Reason
              </Typography>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart 
                  data={(topReasons.length > 0 && reasonsData.length > 0) ? 
                    topReasons
                    .map(reason => {
                      // Calculate total penalty for this reason
                      const matchingReasons = reasonsData.filter(item => 
                        item.reason && reason.name && 
                        item.reason.trim().toLowerCase() === reason.name.trim().toLowerCase()
                      );
                      

                      matchingReasons.forEach(item => {

                      });
                      
                      const reasonPenalty = matchingReasons.reduce((sum, item) => {
                        const penalty = parseFloat(item.penalty || 0);
                        return isNaN(penalty) ? sum : sum + penalty;
                      }, 0);
                      

                      
                      // Calculate saveable penalty (where Match/Not is False)
                      const matchingValidations = validationData.filter(vRow => {
                        return vRow.stated_reason && 
                          reason.name && 
                          vRow.stated_reason.trim().toLowerCase() === reason.name.trim().toLowerCase() && 
                          vRow["Match/Not"] === "False";
                      });
                      

                      
                      const saveablePenalty = matchingValidations.map(vRow => {
                        const rRow = reasonsData.find(r => 
                          r.PO_ID === vRow.PO_ID && 
                          r.reason && 
                          vRow.stated_reason && 
                          r.reason.trim().toLowerCase() === vRow.stated_reason.trim().toLowerCase()
                        );
                        const penalty = rRow ? parseFloat(rRow.penalty || 0) : 0;

                        return isNaN(penalty) ? 0 : penalty;
                      }).reduce((sum, penalty) => sum + penalty, 0);
                      

                      
                      // Calculate non-saveable penalty
                      const nonSaveablePenalty = Math.max(0, reasonPenalty - saveablePenalty);
                      
                      // Display shortened reason name for better readability
                      const shortenedName = reason.name.length > 25 
                        ? reason.name.substring(0, 23) + '...' 
                        : reason.name;
                      
                      // Calculate savings percentage
                      const savingsPercentage = reasonPenalty > 0 
                        ? (saveablePenalty / reasonPenalty) * 100 
                        : 0;
                      
                      // Calculate transaction counts
                      const totalTransactions = validationData.filter(row => 
                        row.stated_reason && 
                        reason.name && 
                        row.stated_reason.trim().toLowerCase() === reason.name.trim().toLowerCase()
                      ).length;
                      
                      const disputeTransactions = validationData.filter(row => 
                        row.stated_reason && 
                        reason.name && 
                        row.stated_reason.trim().toLowerCase() === reason.name.trim().toLowerCase() && 
                        row["Match/Not"] === "False"
                      ).length;
                      
                      return {
                        name: shortenedName,
                        fullName: reason.name,
                        totalPenalty: parseFloat(reasonPenalty.toFixed(2)),
                        saveablePenalty: parseFloat(saveablePenalty.toFixed(2)),
                        regularPenalty: parseFloat(nonSaveablePenalty.toFixed(2)),
                        savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
                        totalTransactions,
                        disputeTransactions
                      };
                    })
                    // Sort by saveable penalty amount for better visualization
                    .sort((a, b) => b.saveablePenalty - a.saveablePenalty)
                    // If data is empty, show sample data for visualization purposes
                    : [
                      {
                        name: "price mismatch", 
                        fullName: "price mismatch",
                        totalPenalty: 3500, 
                        saveablePenalty: 2800, 
                        regularPenalty: 700, 
                        savingsPercentage: 80,
                        totalTransactions: 12,
                        disputeTransactions: 9
                      },
                      {
                        name: "unit price mismatch", 
                        fullName: "unit price mismatch",
                        totalPenalty: 2700, 
                        saveablePenalty: 1950, 
                        regularPenalty: 750,
                        savingsPercentage: 72,
                        totalTransactions: 8,
                        disputeTransactions: 6
                      },
                      {
                        name: "currency mismatch", 
                        fullName: "currency mismatch",
                        totalPenalty: 1800, 
                        saveablePenalty: 1300, 
                        regularPenalty: 500,
                        savingsPercentage: 72,
                        totalTransactions: 5,
                        disputeTransactions: 3
                      },
                      {
                        name: "total price discrepancy", 
                        fullName: "total price discrepancy",
                        totalPenalty: 3200, 
                        saveablePenalty: 2100, 
                        regularPenalty: 1100,
                        savingsPercentage: 65,
                        totalTransactions: 10,
                        disputeTransactions: 7
                      },
                      {
                        name: "no reason", 
                        fullName: "no reason",
                        totalPenalty: 1500, 
                        saveablePenalty: 0, 
                        regularPenalty: 1500,
                        savingsPercentage: 0,
                        totalTransactions: 6,
                        disputeTransactions: 0
                      }
                    ]
                  }
                  margin={{ top: 20, right: 30, left: 40, bottom: 80 }}
                  barCategoryGap={16}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="name"
                    interval={0}
                    tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                    height={80}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={value => `$${value.toLocaleString()}`}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={value => `${value}%`}
                    domain={[0, 100]}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ 
                            backgroundColor: 'white', 
                            padding: '15px', 
                            border: '1px solid #ccc', 
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}>
                            <p style={{ 
                              margin: '0 0 8px', 
                              fontWeight: 'bold', 
                              fontSize: '14px',
                              borderBottom: '1px solid #eee', 
                              paddingBottom: '8px', 
                              color: '#1565C0'
                            }}>{data.fullName}</p>
                            
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '4px 0', color: '#555' }}>Total Penalty:</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#2E7D32', textAlign: 'right' }}>
                                    ${data.totalPenalty.toLocaleString()}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '4px 0', color: '#555' }}>Recoverable:</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#C62828', textAlign: 'right' }}>
                                    ${data.saveablePenalty.toLocaleString()}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '4px 0', color: '#555' }}>Recovery Rate:</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#C62828', textAlign: 'right' }}>
                                    {data.savingsPercentage}%
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '4px 0', color: '#555' }}>Transactions:</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#333', textAlign: 'right' }}>
                                    {data.totalTransactions} ({data.disputeTransactions} disputable)
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    name="Regular Penalties" 
                    dataKey="regularPenalty" 
                    fill="#2E7D32" 
                    barSize={40} 
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    label={{
                      position: 'inside',
                      formatter: (value) => value > 1000 ? `$${(value/1000).toFixed(0)}k` : (value > 0 ? `$${value.toLocaleString()}` : ''),
                      fill: '#000000',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    name="Recoverable Amount" 
                    dataKey="saveablePenalty" 
                    fill="#D32F2F" 
                    barSize={40} 
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    label={{
                      position: 'top',
                      formatter: (value) => value > 1000 ? `$${(value/1000).toFixed(0)}k` : (value > 0 ? `$${value.toLocaleString()}` : ''),
                      fill: '#000000',
                      fontSize: 13,
                      fontWeight: 700,
                      dy: -8
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Recovery Rate"
                    dataKey="savingsPercentage"
                    stroke="#2E7D32"
                    strokeWidth={3}
                    dot={{ fill: '#2E7D32', strokeWidth: 2, r: 6 }}
                    activeDot={{ fill: '#1B5E20', strokeWidth: 2, r: 8 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        {/* PO-wise Table - Right Side */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
            borderRadius: '12px',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ pb: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: '5px', 
                  height: '24px', 
                  backgroundColor: '#1976d2', 
                  borderRadius: '3px',
                  mr: 2
                }}/>
                <Typography variant="h6" fontWeight="500" color="#000">PO-wise Reasons & Comments</Typography>
              </Box>
              <TableContainer sx={{ 
                maxHeight: 450,
                flex: 1,
                "&::-webkit-scrollbar": {
                  width: 8,
                  height: 8,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1",
                  borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: 4,
                },
              }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'linear-gradient(to right, #f5f5f5, #fafafa)' }}>
                      <TableCell 
                        sx={{ 
                          fontWeight: 700, 
                          backgroundColor: '#f5f5f5',
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '15%',
                          borderBottom: '2px solid #1976d2'
                        }}
                      >
                        PO ID
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 700, 
                          backgroundColor: '#f5f5f5',
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '25%',
                          borderBottom: '2px solid #1976d2'
                        }}
                      >
                        Reason
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 700, 
                          backgroundColor: '#f5f5f5',
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '15%',
                          textAlign: 'center',
                          borderBottom: '2px solid #1976d2'
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 700, 
                          backgroundColor: '#f5f5f5',
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '45%',
                          borderBottom: '2px solid #1976d2'
                        }}
                      >
                        Comments
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, idx) => (
                        <TableRow 
                          key={idx} 
                          sx={{ 
                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                            '&:nth-of-type(odd)': { backgroundColor: '#ffffff' },
                            '&:hover': { 
                              backgroundColor: 'rgba(25, 118, 210, 0.06)',
                              boxShadow: 'inset 2px 0px 0px #1976d2'
                            },
                            transition: 'all 0.2s ease',
                            borderBottom: '1px solid #eeeeee'
                          }}
                        >
                          <TableCell sx={{ 
                            fontWeight: 600,
                            color: '#202124',
                            fontSize: '14px',
                            padding: '14px'
                          }}>
                            {row.PO_ID}
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#424242',
                            fontSize: '14px',
                            padding: '14px',
                            fontWeight: 500
                          }}>
                            {row.stated_reason ? row.stated_reason.charAt(0).toUpperCase() + row.stated_reason.slice(1).toLowerCase() : '-'}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              color: row["Match/Not"] === "True" ? '#2e7d32' : '#d32f2f',
                              fontWeight: 700,
                              fontSize: '18px',
                              textAlign: 'center',
                              padding: '14px'
                            }}
                          >
                            {row["Match/Not"] === "True" ? '✓' : '✕'}
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#5f6368',
                            fontSize: '13px',
                            padding: '14px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            maxWidth: '350px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {row.Comments ? row.Comments.charAt(0).toUpperCase() + row.Comments.slice(1) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography sx={{ 
                            color: '#5f6368',
                            fontSize: '14px',
                            fontWeight: 500
                          }}>
                            No records found matching your filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#5f6368',
                fontSize: '13px',
                fontWeight: 500
              }}>
                <Typography sx={{ fontSize: '13px', color: '#5f6368' }}>
                  Showing {filteredRows.length} of {validationData.length} records
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={12}>
          <Card sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: '#202124',
                  fontFamily: '"Segoe UI", Roboto, sans-serif',
                  mb: 3,
                  fontSize: '16px'
                }}>
                  Validation Filters
                </Typography>
                
                {/* Filters Section */}
                <Box
                  sx={{
                    backgroundColor: "#f8f9fb",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    p: 2.5,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ flexWrap: "wrap", gap: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#2d3748", display: "flex", alignItems: "center", gap: 1 }}>
                      <FilterListIcon sx={{ fontSize: 20, color: "#667eea" }} />
                      Filters
                    </Typography>
                    
                    <FormControl sx={{ minWidth: 200 }} size="small">
                      <InputLabel sx={{ fontWeight: 500 }}>PO ID</InputLabel>
                      <Select
                        value={filterPOID}
                        label="PO ID"
                        onChange={(e) => setFilterPOID(e.target.value)}
                        sx={{
                          borderRadius: "8px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#cbd5e0",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#a0aec0",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#667eea",
                          },
                        }}
                      >
                        <MenuItem value="">All PO IDs</MenuItem>
                        {poOptions.map((po) => (
                          <MenuItem key={po} value={po}>
                            {po}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl sx={{ minWidth: 200 }} size="small">
                      <InputLabel sx={{ fontWeight: 500 }}>Reason</InputLabel>
                      <Select
                        value={filterReason}
                        label="Reason"
                        onChange={(e) => setFilterReason(e.target.value)}
                        sx={{
                          borderRadius: "8px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#cbd5e0",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#a0aec0",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#667eea",
                          },
                        }}
                      >
                        <MenuItem value="">All Reasons</MenuItem>
                        {reasonOptions.map((reason) => (
                          <MenuItem key={reason} value={reason}>
                            {reason}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }} size="small">
                      <InputLabel sx={{ fontWeight: 500 }}>Penalty</InputLabel>
                      <Select
                        value={filterPenalty}
                        label="Penalty"
                        onChange={(e) => setFilterPenalty(e.target.value)}
                        sx={{
                          borderRadius: "8px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#cbd5e0",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#a0aec0",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#667eea",
                          },
                        }}
                      >
                        <MenuItem value="">All Penalties</MenuItem>
                        <MenuItem value="high">High (&gt;66th percentile)</MenuItem>
                        <MenuItem value="medium">Medium (33rd-66th percentile)</MenuItem>
                        <MenuItem value="low">Low (&lt;33rd percentile)</MenuItem>
                      </Select>
                    </FormControl>

                    {(filterReason || filterPenalty || filterPOID) && (
                      <Button
                        size="small"
                        onClick={() => {
                          setFilterReason("");
                          setFilterPenalty("");
                          setFilterPOID("");
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          color: "#667eea",
                          "&:hover": {
                            backgroundColor: "rgba(102, 126, 234, 0.1)",
                          },
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Stack>
                </Box>

                <TableContainer 
                  sx={{ 
                    maxHeight: 450, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderRadius: '8px',
                    border: '1px solid #e8eaed',
                    overflow: 'hidden'
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{ 
                        backgroundColor: '#f5f5f5'
                      }}>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '14px',
                          borderBottom: '2px solid #1976d2'
                        }}>
                          PO ID
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '14px',
                          borderBottom: '2px solid #1976d2'
                        }}>
                          Reason
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '14px',
                          textAlign: 'center',
                          borderBottom: '2px solid #1976d2'
                        }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '14px',
                          textAlign: 'right',
                          borderBottom: '2px solid #1976d2'
                        }}>
                          Penalty
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: '#1976d2',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '14px',
                          borderBottom: '2px solid #1976d2'
                        }}>
                          Comments
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRows.length > 0 ? filteredRows.map((row, idx) => {
                        // Prepare penalty data for this row
                        const rowPenalty = reasonsData.find(i => i.PO_ID === row.PO_ID);
                        
                        // Set the penalty directly on the row object
                        row.penalty = rowPenalty ? parseFloat(rowPenalty.penalty || 0) : 0;
                        
                        // Determine row style based on Match/Not
                        const isMatch = row["Match/Not"] === "True";
                        
                        return (
                          <TableRow 
                            key={idx}
                            sx={{ 
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.06)',
                                boxShadow: 'inset 2px 0px 0px #1976d2'
                              },
                              transition: 'all 0.2s ease',
                              borderBottom: '1px solid #eeeeee'
                            }}
                          >
                            <TableCell sx={{ 
                              fontWeight: 600,
                              color: '#202124',
                              fontSize: '14px',
                              padding: '14px'
                            }}>
                              {row.PO_ID}
                            </TableCell>
                            <TableCell sx={{ 
                              color: '#424242',
                              fontSize: '14px',
                              padding: '14px',
                              fontWeight: 500
                            }}>
                              {row.stated_reason ? row.stated_reason.charAt(0).toUpperCase() + row.stated_reason.slice(1).toLowerCase() : '-'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: isMatch ? '#2E7D32' : '#d32f2f',
                              fontWeight: 700,
                              fontSize: '18px',
                              textAlign: 'center',
                              padding: '14px'
                            }}>
                              {isMatch ? '✓' : '✕'}
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 600,
                              color: row.penalty > 500 ? '#d32f2f' : row.penalty > 200 ? '#f57c00' : '#2e7d32',
                              fontSize: '14px',
                              textAlign: 'right',
                              padding: '14px'
                            }}>
                              ${row.penalty.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ 
                              color: '#5f6368',
                              fontSize: '13px',
                              padding: '14px',
                              fontWeight: 400,
                              lineHeight: 1.5,
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {row.Comments ? row.Comments.charAt(0).toUpperCase() + row.Comments.slice(1) : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography sx={{ 
                              color: '#5f6368',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>
                              No records found for the selected PO
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ 
                  mt: 2, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#5f6368',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <Typography sx={{ fontSize: '13px', color: '#5f6368' }}>
                    Showing {filteredRows.length} of {validationData.length} records
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ValidationKPIs;
