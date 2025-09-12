import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Tabs, Tab, Button, Divider, LinearProgress } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, ComposedChart } from "recharts";
import { AttachMoney as AttachMoneyIcon, ShowChart as ShowChartIcon, MonetizationOn as MonetizationOnIcon, Savings as SavingsIcon } from '@mui/icons-material';
import { BACKEND_URL } from "../utils/backend";
import PenaltyTable from "./PenaltyTable";

const COLORS = ["#1976d2", "#43a047", "#fbc02d", "#e53935", "#8e24aa", "#00acc1"];

function ValidationKPIs({ refresh }) {
  const [validationData, setValidationData] = useState([]);
  const [reasonsData, setReasonsData] = useState([]);
  const [penaltyMetrics, setPenaltyMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState("");
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        const penaltyRes = await fetch(`${BACKEND_URL}/calculate-penalties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const penaltyData = await penaltyRes.json();
        
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

  if (loading) return <CircularProgress />;

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

  // PO slicer
  const poOptions = validationData.map(row => row.PO_ID);
  const filteredRows = selectedPO
    ? validationData.filter(row => row.PO_ID === selectedPO)
    : validationData;

  return (
    <Box>
  <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 700 }}>Discrepancy Validator</Typography>
      <Grid container spacing={2}>
        {/* KPI Row at top - Revamped */}
        <Grid item xs={12}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1565c0', fontWeight: 600 }}>
                Financial Reconciliation Dashboard
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card sx={{ boxShadow: 'none', bgcolor: '#f3f8ff', height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
                        Total Validations
                      </Typography>
                      <Typography variant="h4" color="#1565c0" fontWeight={700} sx={{ mt: 1 }}>
                        {total.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Financial Transactions Analyzed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ boxShadow: 'none', bgcolor: '#f4f8f3', height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
                        Match Accuracy
                      </Typography>
                      <Typography variant="h4" color="#2e7d32" fontWeight={700} sx={{ mt: 1 }}>
                        {total ? ((match / total) * 100).toFixed(1) : 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Validated PO to Invoice Alignment
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ boxShadow: 'none', bgcolor: '#fef7f7', height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
                        POs with Discrepancy
                      </Typography>
                      <Typography variant="h4" color="#c62828" fontWeight={700} sx={{ mt: 1 }}>
                        {notMatch.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Identified for Resolution
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{ boxShadow: 'none', bgcolor: '#f7f7ff', height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
                        Top Discrepancy Reason
                      </Typography>
                      <Typography variant="h6" color="#5c6bc0" fontWeight={600} sx={{ mt: 1, fontSize: '1.1rem' }}>
                        {topReasons.length > 0 ? (
                          topReasons[0].name.length > 20 
                            ? topReasons[0].name.substring(0, 18) + '...' 
                            : topReasons[0].name
                        ) : '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {topReasons.length > 0 ? `${topReasons[0].value} Occurrences` : '-'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Penalty Metrics Card - Revamped */}
        <Grid item xs={12}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" align="center" sx={{ mb: 2, color: '#1565c0', fontWeight: 600 }}>
                Financial Impact Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    height: '100%', 
                    borderRadius: '8px',
                    backgroundColor: 'rgba(30, 136, 229, 0.1)',
                    border: '1px solid rgba(30, 136, 229, 0.2)',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Typography variant="h6" fontWeight={600} color="#1976D2" textAlign="center">
                      Total Penalty Exposure
                    </Typography>
                    <Typography variant="h3" color="#1976D2" fontWeight={700} sx={{ 
                      my: 2,
                      fontSize: '2.6rem',
                    }}>
                      ${penaltyMetrics?.total_penalty_claimed?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976D2', opacity: 0.9 }} textAlign="center">
                      Across {validationData.length} validated transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    height: '100%', 
                    borderRadius: '8px',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    border: '1px solid rgba(46, 125, 50, 0.2)',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}>
                    <Typography variant="h6" fontWeight={600} color="#2E7D32" textAlign="center">
                      Potential Cost Recovery
                    </Typography>
                    <Typography variant="h3" color="#2E7D32" fontWeight={700} sx={{ 
                      my: 2,
                      fontSize: '2.6rem'
                    }}>
                      ${penaltyMetrics?.penalty_that_can_be_saved?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#2E7D32', opacity: 0.9, mb: 2 }} textAlign="center">
                      From {notMatch} disputable transactions
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => setTabValue(1)}
                      startIcon={<ShowChartIcon />}
                      sx={{ 
                        borderRadius: '20px', 
                        fontSize: '0.75rem',
                        position: 'absolute',
                        bottom: '16px',
                        fontWeight: 500,
                        ':hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.1)'
                        }
                      }}
                    >
                      VIEW DETAILS
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    height: '100%', 
                    borderRadius: '8px',
                    backgroundColor: 'rgba(230, 81, 0, 0.1)',
                    border: '1px solid rgba(230, 81, 0, 0.2)',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Typography variant="h6" fontWeight={600} color="#E65100" textAlign="center">
                      Savings Opportunity Rate
                    </Typography>
                    <Typography variant="h3" color="#E65100" fontWeight={700} sx={{ 
                      my: 2,
                      fontSize: '2.8rem'
                    }}>
                      {penaltyMetrics?.percentage_saveable || '0'}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E65100', opacity: 0.9 }} textAlign="center">
                      ROI on validation process
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* Validation Performance Dashboard with various charts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={3} sx={{ fontWeight: 600, color: '#1565C0' }}>
                Validation Performance Dashboard
              </Typography>
              

              
              {/* Main Visualization - Average Penalty by Reason (Pie Chart) */}
              <Typography variant="h6" align="center" mb={3} sx={{ fontWeight: 600, color: '#1565C0' }}>
                Average Penalty Amount by Reason
              </Typography>
              <Box sx={{ width: '100%', height: 350, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topReasons.slice(0, 5).map(r => {
                        // Get all penalties for this reason
                        const penaltyAmounts = reasonsData
                          .filter(item => 
                            item.reason && r.name && 
                            item.reason.trim().toLowerCase() === r.name.trim().toLowerCase()
                          )
                          .map(item => parseFloat(item.penalty || 0))
                          .filter(p => !isNaN(p));
                        
                        const avgPenalty = penaltyAmounts.length > 0 
                          ? penaltyAmounts.reduce((sum, p) => sum + p, 0) / penaltyAmounts.length 
                          : 0;
                        
                        return {
                          name: r.name,
                          value: parseFloat(avgPenalty.toFixed(2)),
                          count: penaltyAmounts.length,
                          total: penaltyAmounts.reduce((sum, p) => sum + p, 0),
                          color: COLORS[topReasons.indexOf(r) % COLORS.length]
                        };
                      }).filter(item => item.value > 0).sort((a, b) => b.value - a.value)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={130}
                      innerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({
                        cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#333333" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                          >
                            ${value}
                          </text>
                        );
                      }}
                    >
                      {topReasons.slice(0, 5).map((r, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`$${value.toLocaleString()}`, 'Avg Penalty']}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{ 
                              background: 'white', 
                              padding: '12px 15px', 
                              border: '1px solid #ccc', 
                              borderRadius: '8px',
                              boxShadow: '0 3px 14px rgba(0,0,0,0.15)'
                            }}>
                              <p style={{ 
                                fontWeight: 'bold', 
                                borderBottom: '1px solid #eee', 
                                paddingBottom: '8px',
                                marginTop: 0,
                                marginBottom: '10px',
                                fontSize: '15px',
                                color: '#1565C0'
                              }}>{data.name}</p>
                              <div style={{ fontSize: '14px' }}>
                                <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#333' }}>
                                  Average Penalty: <span style={{ color: '#1976D2', float: 'right', marginLeft: '15px' }}>${data.value.toLocaleString()}</span>
                                </p>
                                <p style={{ margin: '5px 0', color: '#555' }}>
                                  Transaction Count: <span style={{ fontWeight: '500', float: 'right', marginLeft: '15px' }}>{data.count}</span>
                                </p>
                                <p style={{ margin: '5px 0', color: '#555' }}>
                                  Total Impact: <span style={{ fontWeight: '500', float: 'right', marginLeft: '15px' }}>${data.total.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconSize={12}
                      iconType="circle"
                      formatter={(value, entry, index) => (
                        <span style={{ color: '#333333', fontSize: '0.875rem', padding: '0 10px' }}>
                          {value}
                        </span>
                      )}
                    />
                    <text 
                      x="50%" 
                      y="50%" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      style={{ fontWeight: 'bold', fontSize: '16px', fill: '#333333' }}
                    >
                      Avg Penalty
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              {/* Key Findings Table */}
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Key Validation Insights</Typography>
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
        
        {/* Horizontal Bar Chart: Top 5 Reason Frequency - Revamped */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={2} sx={{ fontWeight: 600, color: '#1565C0' }}>
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
        
        {/* Penalty by Reason Chart - Enhanced for Sales Pitch */}
        <Grid item xs={12} md={12}>
          <Card sx={{ mb: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
            <CardContent>
              <Typography variant="h6" align="center" mb={2} sx={{ fontWeight: 600, color: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ marginRight: '8px' }}>💰</span> Financial Recovery Opportunity by Reason <span style={{ marginLeft: '8px' }}>💰</span>
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
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
                                  <td style={{ padding: '4px 0', fontWeight: 'bold', color: '#1976d2', textAlign: 'right' }}>
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
                    fill="#64B5F6" 
                    barSize={40} 
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="left"
                    name="Recoverable Amount" 
                    dataKey="saveablePenalty" 
                    fill="#EF5350" 
                    barSize={40} 
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    label={{
                      position: 'top',
                      formatter: (value) => value > 0 ? `$${value.toLocaleString()}` : '',
                      fill: '#333',
                      fontSize: 12,
                      fontWeight: 500,
                      dy: -8
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Recovery Rate"
                    dataKey="savingsPercentage"
                    stroke="#4CAF50"
                    strokeWidth={3}
                    dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                    activeDot={{ fill: '#2E7D32', strokeWidth: 2, r: 8 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        {/* Match vs Not Match Pie Chart */}
        {/* PO-wise Table at the top - Enhanced */}
        <Grid item xs={12} md={12}>
          <Card sx={{ 
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: '5px', 
                  height: '24px', 
                  backgroundColor: '#1976d2', 
                  borderRadius: '3px',
                  mr: 2
                }}/>
                <Typography variant="h6" fontWeight="bold">PO-wise Reasons & Comments</Typography>
              </Box>
              <TableContainer sx={{ 
                maxHeight: 350,
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
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(25,118,210,0.05)', 
                          width: '15%' 
                        }}
                      >
                        PO ID
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(25,118,210,0.05)',
                          width: '25%'
                        }}
                      >
                        Reason
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(25,118,210,0.05)',
                          width: '15%'
                        }}
                      >
                        Match/Not
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          backgroundColor: 'rgba(25,118,210,0.05)',
                          width: '45%'
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
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            '&:hover': { backgroundColor: 'rgba(25,118,210,0.04)' },
                            ...(row["Match/Not"] === "False" ? { backgroundColor: 'rgba(255, 235, 238, 0.3)' } : {})
                          }}
                        >
                          <TableCell sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                            {row.PO_ID}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                            {row.stated_reason}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                              color: row["Match/Not"] === "True" ? '#2e7d32' : '#c62828',
                              fontWeight: 'bold'
                            }}
                          >
                            {row["Match/Not"]}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                            {row.Comments}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No records found matching your filters</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'flex-end',
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Showing {filteredRows.length} of {validationData.length} records
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={12}>
          <Box mt={3}>
            {/* Tabs for switching between filtered view and full penalty analysis */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="validation tabs">
                <Tab label="Filtered View" />
                <Tab label="Penalty Analysis" />
              </Tabs>
            </Box>
            
            {/* Tab Panel 1: Filtered View */}
            {tabValue === 0 && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="po-select-label">Select PO</InputLabel>
                  <Select
                    labelId="po-select-label"
                    value={selectedPO}
                    label="Select PO"
                    onChange={e => setSelectedPO(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {poOptions.map(po => (
                      <MenuItem key={po} value={po}>{po}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                    PO-wise Reasons, Comments & Penalties
                  </Typography>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 300, 
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ 
                          backgroundColor: '#f5f5f5',
                          '& .MuiTableCell-head': {
                            fontWeight: 'bold',
                            color: 'primary.main',
                            fontSize: '0.95rem'
                          }
                        }}>
                          <TableCell>PO ID</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Match/Not</TableCell>
                          <TableCell>Penalty</TableCell>
                          <TableCell>Comments</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRows.map((row, idx) => {
                          // Prepare penalty data for this row
                          const rowPenalty = reasonsData.find(i => i.PO_ID === row.PO_ID);
                          
                          // Set the penalty directly on the row object
                          row.penalty = rowPenalty ? parseFloat(rowPenalty.penalty || 0) : 0;
                          
                          // Determine row style based on Match/Not
                          const isMatch = row["Match/Not"] === "True";
                          const bgColor = isMatch ? '#f9fff9' : 'rgba(255, 235, 238, 0.5)';
                          
                          return (
                            <TableRow 
                              key={idx}
                              sx={{ 
                                bgcolor: bgColor,
                                '&:hover': {
                                  bgcolor: isMatch ? 'rgba(200, 230, 201, 0.3)' : 'rgba(255, 205, 210, 0.3)',
                                },
                                borderBottom: '1px solid #e0e0e0',
                                cursor: 'pointer'
                              }}
                            >
                              <TableCell sx={{ fontWeight: 500 }}>{row.PO_ID}</TableCell>
                              <TableCell>{row.stated_reason}</TableCell>
                              <TableCell sx={{ 
                                color: isMatch ? '#2E7D32' : '#C62828',
                                fontWeight: 'medium'
                              }}>
                                {isMatch ? 'True' : 'False'}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {row.penalty > 0 ? `$${row.penalty.toFixed(2)}` : "$0.00"}
                              </TableCell>
                              <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                {row.Comments}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}
            
            {/* Tab Panel 2: Penalty Analysis */}
            {tabValue === 1 && (
              <PenaltyTable validationData={validationData} reasonsData={reasonsData} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ValidationKPIs;
