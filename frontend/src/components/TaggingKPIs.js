import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, OutlinedInput, Chip, Stack } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BACKEND_URL } from "../utils/backend";

const COLORS = ["#1976d2", "#43a047", "#fbc02d", "#e53935", "#8e24aa", "#00acc1"];

function TaggingKPIs({ refresh }) {
  const [reasonsData, setReasonsData] = useState([]);
  const [commentsData, setCommentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const listRes = await fetch(`${BACKEND_URL}/results/filtered_po_reason_list.csv`);
      const listText = await listRes.text();
      const commentsRes = await fetch(`${BACKEND_URL}/results/filtered_po_reason_comments.csv`);
      const commentsText = await commentsRes.text();
      // Parse CSVs
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
  const parsedReasons = parseCSV(listText);
  const parsedComments = parseCSV(commentsText);
  console.log('parsedReasons', parsedReasons);
  console.log('parsedComments', parsedComments);
  setReasonsData(parsedReasons);
  setCommentsData(parsedComments);
      setLoading(false);
    }
    fetchData();
  }, [refresh]);

  if (loading) return <CircularProgress />;


  // KPI: Total POs, Unique Reasons, Reason Distribution
  const totalPOs = reasonsData.length;
  const reasonCounts = {};
  reasonsData.forEach((row) => {
    if (row.list_of_reasons) {
      row.list_of_reasons.split(",").forEach((r) => {
        const reason = r.trim();
        if (reason) reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    }
  });
  const reasonDist = Object.entries(reasonCounts).map(([name, value], i) => ({ name, value }));

  // Trend: POs with multiple reasons
  const multiReasonPOs = reasonsData.filter(row => row.list_of_reasons && row.list_of_reasons.split(",").length > 1).length;

  // Top 5 reasons for pie/bar
  const top5Reasons = reasonDist.slice().sort((a, b) => b.value - a.value).slice(0, 5);
  const mostFrequentReason = top5Reasons.length > 0 ? top5Reasons[0].name : "-";

  // All unique reasons for slicer
  const allReasons = Array.from(new Set(reasonDist.map(r => r.name)));
  // PO slicer
  const poOptions = Array.from(new Set(reasonsData.map(row => row.PO_ID)));

  // Table filter logic
  let filteredComments = commentsData;
  if (selectedPO) filteredComments = filteredComments.filter(row => row.PO_ID === selectedPO);
  if (selectedReasons.length > 0) filteredComments = filteredComments.filter(row => selectedReasons.includes(row.reason));

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa',
      minHeight: '100vh',
      p: 2
    }}>
      <Grid container spacing={2}>
        {/* Header */}
        <Grid item xs={12}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              color: '#202124',
              mb: 0.5,
              fontFamily: 'Google Sans, Roboto, sans-serif'
            }}
          >
            Risk Intelligence Dashboard
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#5f6368',
              mb: 2,
              fontFamily: 'Google Sans, Roboto, sans-serif'
            }}
          >
            AI-powered transaction risk analysis and detection
          </Typography>
        </Grid>

        {/* KPI Cards Row */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Flagged Transactions Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #dadce0',
                p: 2,
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#5f6368',
                      fontWeight: 500,
                      mb: 0.5,
                      fontFamily: 'Google Sans, Roboto, sans-serif',
                      fontSize: '12px'
                    }}
                  >
                    Flagged Transactions
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#1a73e8',
                      fontWeight: 600,
                      fontFamily: 'Google Sans, Roboto, sans-serif'
                    }}
                  >
                    {totalPOs}
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#5f6368',
                    fontFamily: 'Google Sans, Roboto, sans-serif',
                    fontSize: '11px'
                  }}
                >
                  AI Risk Detection
                </Typography>
              </Card>
            </Grid>

            {/* Multi-Risk Orders Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #dadce0',
                p: 2,
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#5f6368',
                      fontWeight: 500,
                      mb: 0.5,
                      fontFamily: 'Google Sans, Roboto, sans-serif',
                      fontSize: '12px'
                    }}
                  >
                    Multi-Risk Orders
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#ea4335',
                      fontWeight: 600,
                      fontFamily: 'Google Sans, Roboto, sans-serif'
                    }}
                  >
                    {multiReasonPOs}
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#5f6368',
                    fontFamily: 'Google Sans, Roboto, sans-serif',
                    fontSize: '11px'
                  }}
                >
                  {((multiReasonPOs / totalPOs) * 100).toFixed(1)}% Multiple Flags
                </Typography>
              </Card>
            </Grid>

            {/* Average Risk Density Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #dadce0',
                p: 2,
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#5f6368',
                      fontWeight: 500,
                      mb: 0.5,
                      fontFamily: 'Google Sans, Roboto, sans-serif',
                      fontSize: '12px'
                    }}
                  >
                    Avg Risk Density
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#34a853',
                      fontWeight: 600,
                      fontFamily: 'Google Sans, Roboto, sans-serif'
                    }}
                  >
                    {(reasonDist.reduce((sum, reason) => sum + reason.value, 0) / Math.max(1, totalPOs)).toFixed(1)}
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#5f6368',
                    fontFamily: 'Google Sans, Roboto, sans-serif',
                    fontSize: '11px'
                  }}
                >
                  Flags per Transaction
                </Typography>
              </Card>
            </Grid>

            {/* Top Risk Factor Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                border: '1px solid #dadce0',
                p: 2,
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#5f6368',
                      fontWeight: 500,
                      mb: 0.5,
                      fontFamily: 'Google Sans, Roboto, sans-serif',
                      fontSize: '12px'
                    }}
                  >
                    Top Risk Factor
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#fbbc04',
                      fontWeight: 600,
                      fontFamily: 'Google Sans, Roboto, sans-serif',
                      lineHeight: 1.2,
                      fontSize: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {mostFrequentReason}
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#5f6368',
                    fontFamily: 'Google Sans, Roboto, sans-serif',
                    fontSize: '11px'
                  }}
                >
                  {top5Reasons.length > 0 ? 
                    `${top5Reasons[0].value} occurrences (${((top5Reasons[0].value / totalPOs) * 100).toFixed(1)}%)` : 
                    'No data'}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>


        
        {/* Slicers */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="po-select-label">PO ID</InputLabel>
            <Select
              labelId="po-select-label"
              value={selectedPO}
              label="PO ID"
              onChange={e => setSelectedPO(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All</MenuItem>
              {poOptions.map(po => (
                <MenuItem key={po} value={po}>{po}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="reason-select-label">Reason</InputLabel>
            <Select
              labelId="reason-select-label"
              multiple
              value={selectedReasons}
              onChange={e => setSelectedReasons(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Reason" />}
              renderValue={selected => (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selected.map((value) => <Chip key={value} label={value} />)}
                </Stack>
              )}
            >
              {allReasons.map(reason => (
                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Enhanced Pie Chart for Risk Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                      borderRadius: '12px',
                      background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)' }}>
            <CardContent sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: '6px', 
                  height: '28px', 
                  backgroundColor: '#1976d2', 
                  borderRadius: '3px',
                  mr: 2,
                  boxShadow: '0 2px 4px rgba(25,118,210,0.3)'
                }}/>
                <Box>
                  <Typography variant="h6" fontWeight="bold">Top 5 Reasons</Typography>
                  <Typography variant="caption" color="text.secondary">Distribution of risk categories across transactions</Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                width: '100%', 
                height: 320, 
                display: 'flex', 
                position: 'relative',
                justifyContent: 'center', 
                alignItems: 'center'
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={top5Reasons.map(reason => ({
                        ...reason,
                        // Add priority score based on occurrence frequency
                        priorityScore: Math.round((reason.value / totalPOs) * 100),
                        // Add risk complexity based on reason name length
                        complexity: reason.name.length > 15 ? 'High' : reason.name.length > 10 ? 'Medium' : 'Low'
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      label={({ value }) => value}
                      labelLine={true}
                    >
                      {top5Reasons.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const { priorityScore, complexity } = props.payload;
                        return [
                          <div>
                            <div style={{fontWeight: 'bold'}}>{value} occurrences</div>
                            <div>Priority score: {priorityScore}/100</div>
                            <div>Complexity: {complexity}</div>
                          </div>
                        ]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center KPI */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '50%',
                  width: '130px',
                  height: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 0 20px rgba(0,0,0,0.15)',
                  border: '3px solid rgba(25,118,210,0.1)',
                  zIndex: 2
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0 }}>TOTAL RISKS</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary" sx={{ my: 0.5 }}>
                    {top5Reasons.reduce((sum, r) => sum + r.value, 0)}
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    Flagged Items
                  </Typography>
                </Box>
              </Box>
              
              {/* Enhanced Legend */}
              <Box sx={{ 
                mt: 1, 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '8px'
              }}>
                {top5Reasons.map((entry, index) => {
                  const priorityScore = Math.round((entry.value / totalPOs) * 100);
                  const complexity = entry.name.length > 15 ? 'High' : entry.name.length > 10 ? 'Medium' : 'Low';
                  return (
                    <Box key={entry.name} sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'flex-start', 
                      mr: 3, 
                      mb: 1,
                      minWidth: '120px'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          bgcolor: COLORS[index % COLORS.length], 
                          borderRadius: '50%', 
                          mr: 1,
                          boxShadow: `0 0 5px ${COLORS[index % COLORS.length]}80`
                        }} />
                        <Typography variant="body2" fontWeight="bold">{entry.name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ ml: 3 }}>
                        <Box component="span" fontWeight="bold">{entry.value}</Box> occurrences
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 3 }}>
                        Priority: {priorityScore > 75 ? 'High' : priorityScore > 50 ? 'Medium' : 'Low'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Enhanced Bar Chart for Risk Frequency */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            mb: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
            borderRadius: '12px',
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: '6px', 
                  height: '28px', 
                  backgroundColor: '#e53935', 
                  borderRadius: '3px',
                  mr: 2,
                  boxShadow: '0 2px 4px rgba(229,57,53,0.3)'
                }}/>
                <Box>
                  <Typography variant="h6" fontWeight="bold">Reason Frequency (Bar)</Typography>
                  <Typography variant="caption" color="text.secondary">Risk categories prioritized by occurrence</Typography>
                </Box>
              </Box>
              
              {/* Create enhanced data with risk metrics */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={reasonDist
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map(reason => ({
                      ...reason,
                      frequency: reason.value,
                      percentage: Math.round((reason.value / totalPOs) * 100),
                      priorityLevel: reason.value > totalPOs * 0.5 ? 'High' : 
                                     reason.value > totalPOs * 0.2 ? 'Medium' : 'Low'
                    }))}
                  layout="vertical" 
                  margin={{ left: 150, right: 40, top: 20, bottom: 20 }}
                >
                  <XAxis 
                    type="number" 
                    allowDecimals={false} 
                    tick={{ fontWeight: 'bold', fill: '#555' }}
                    label={{ 
                      value: 'Number of Occurrences', 
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#555'
                    }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontWeight: 'bold', fill: '#555', fontSize: 13 }} 
                    width={150}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Occurrences"
                    barSize={24} 
                    radius={[0, 4, 4, 0]}
                    label={{ 
                      position: 'right',
                      formatter: (value) => value, 
                      fill: '#333',
                      fontSize: 12
                    }}
                  >
                    {reasonDist.map((entry, index) => {
                      // Color based on priority - higher values are more vibrant
                      let baseColor;
                      if (entry.value > totalPOs * 0.5) {
                        baseColor = '#e53935'; // Red for high priority
                      } else if (entry.value > totalPOs * 0.2) {
                        baseColor = '#ff9800'; // Orange for medium priority  
                      } else {
                        baseColor = '#4caf50'; // Green for low priority
                      }
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={baseColor} 
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Bar>
                  <Tooltip
                    formatter={(value) => [`${value}`, 'Occurrences']}
                    labelFormatter={(value) => `Category: ${value}`}
                    cursor={{fill: 'rgba(0,0,0,0.1)'}}
                    content={(props) => {
                      if (!props.active || !props.payload || !props.payload[0]) return null;
                      const data = props.payload[0].payload;
                      return (
                        <Box sx={{
                          bgcolor: '#fff',
                          p: 1.5,
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                        }}>
                          <Typography variant="subtitle2" sx={{ borderBottom: '1px solid #eee', pb: 0.5, mb: 1 }}>
                            {data.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <Box component="span" fontWeight="bold">Occurrences:</Box> {data.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <Box component="span" fontWeight="bold">Percentage:</Box> {data.percentage}% of total
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: data.priorityLevel === 'High' ? 'error.main' : 
                                   data.priorityLevel === 'Medium' ? 'warning.main' : 'success.main'
                          }}>
                            <Box component="span" fontWeight="bold">Priority:</Box> {data.priorityLevel}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.disabled' }}>
                            Click for detailed information
                          </Typography>
                        </Box>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Risk summary footer */}
              <Box sx={{ 
                mt: 2,
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: 'rgba(25,118,210,0.05)',
                border: '1px solid rgba(25,118,210,0.2)',
              }}>
                <Typography variant="subtitle2" color="primary.main">
                  Total Risk Flags: {reasonDist.reduce((sum, reason) => sum + reason.value, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Across {reasonDist.length} distinct risk categories • {totalPOs} flagged purchase orders
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* PO-wise Table - Enhanced */}
        <Grid item xs={12}>
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
                          width: '60%'
                        }}
                      >
                        Comments
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredComments.length > 0 ? (
                      filteredComments.map((row, idx) => (
                        <TableRow 
                          key={idx} 
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            '&:hover': { backgroundColor: 'rgba(25,118,210,0.04)' }
                          }}
                        >
                          <TableCell sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                            {row.PO_ID}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                              color: row.reason.includes('Missing') ? 'error.main' : 
                                    row.reason.includes('price') ? 'warning.main' : 
                                    'text.primary'
                            }}
                          >
                            {row.reason}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                            {row.comments}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
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
                Showing {filteredComments.length} of {commentsData.length} records
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default TaggingKPIs;
