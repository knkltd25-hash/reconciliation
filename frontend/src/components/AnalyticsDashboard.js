import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import KPICard from './KPICard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Button from '@mui/material/Button';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LinearProgress from '@mui/material/LinearProgress';
import { ResponsiveContainer } from 'recharts';
import React, { useState, useEffect } from "react";

import { apiCall } from "../utils/api";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

const AnalyticsDashboard = () => {
  const [poData, setPoData] = useState(null);
  const [discrepancyBreakdown, setDiscrepancyBreakdown] = useState([]);
  const [topPos, setTopPos] = useState({ topRecoveryPOS: [], topPenaltyPOS: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [issueStats] = useState({
    total: 144,
    open: 52,
    inProgress: 42,
    resolved: 50,
  });

  const [categoryBreakdown] = useState([
    { category: "Invoice Issue", count: 46, percentage: 32 },
    { category: "GRN Issue", count: 42, percentage: 29 },
    { category: "Quantity Mismatch", count: 26, percentage: 18 },
    { category: "Shipping Issue", count: 17, percentage: 12 },
    { category: "Late Delivery Issue", count: 13, percentage: 9 },
  ]);

  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch real data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics data
        const analyticsResponse = await fetch("http://54.145.92.198:8000/api/po-analytics");
        const analyticsData = await analyticsResponse.json();
        
        if (analyticsData.status === "success") {
          setPoData(analyticsData.poData);
          setDiscrepancyBreakdown(analyticsData.discrepancyBreakdown);
          setError(null);
        } else {
          setError(analyticsData.message || "Failed to load analytics");
        }
        
        // Fetch top pos data separately with its own error handling
        try {
          const topPosResponse = await fetch("http://54.145.92.198:8000/api/top-pos");
          if (topPosResponse.ok) {
            const topPosData = await topPosResponse.json();
            if (topPosData.status === "success") {
              setTopPos(topPosData);
            }
          } else {
            // Use mock data for top pos if endpoint fails
            console.warn("Top POS endpoint failed, using mock data");
            setTopPos({
              topRecoveryPOS: [
                { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", recovery_amount: 15000 },
                { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", recovery_amount: 12000 },
                { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
                { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
                { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", recovery_amount: 8500 },
              ],
              topPenaltyPOS: [
                { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", penalty_amount: 15000, issue: "PO or Invoice data not found" },
                { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", penalty_amount: 12000, issue: "PO or GRN data not found" },
                { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=178, GRN=205" },
                { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=173, GRN=98" },
                { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Under-delivery: PO=183, GRN=167" },
              ]
            });
          }
        } catch (topPosErr) {
          console.warn("Top POS fetch error, using mock data:", topPosErr);
          setTopPos({
            topRecoveryPOS: [
              { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", recovery_amount: 15000 },
              { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", recovery_amount: 12000 },
              { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
              { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
              { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", recovery_amount: 8500 },
            ],
            topPenaltyPOS: [
              { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", penalty_amount: 15000, issue: "PO or Invoice data not found" },
              { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", penalty_amount: 12000, issue: "PO or GRN data not found" },
              { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=178, GRN=205" },
              { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=173, GRN=98" },
              { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Under-delivery: PO=183, GRN=167" },
            ]
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to connect to analytics server");
        // Use mock data as fallback
        setPoData({
          totalPOs: 487,
          posWithoutIssues: 285,
          posWithIssues: 202,
          correctWithIssues: 78,
          withDiscrepancies: 124,
          potentialRecoveryAmount: 1875000,
        });
        setDiscrepancyBreakdown([
          { category: "Invoice Issue", posCount: 46, avgRecoveryPerPO: 15000, totalRecovery: 690000 },
          { category: "GRN Issue", posCount: 42, avgRecoveryPerPO: 12000, totalRecovery: 504000 },
          { category: "Quantity Mismatch", posCount: 26, avgRecoveryPerPO: 8500, totalRecovery: 221000 },
          { category: "Shipping Issue", posCount: 17, avgRecoveryPerPO: 5000, totalRecovery: 85000 },
          { category: "Late Delivery Issue", posCount: 13, avgRecoveryPerPO: 3500, totalRecovery: 45500 },
          { category: "Unspecified Issue", posCount: 8, avgRecoveryPerPO: 2000, totalRecovery: 16000 },
        ]);
        setTopPos({
          topRecoveryPOS: [
            { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", recovery_amount: 15000 },
            { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", recovery_amount: 12000 },
            { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
            { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", recovery_amount: 8500 },
            { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", recovery_amount: 8500 },
          ],
          topPenaltyPOS: [
            { po_id: "PO1100", reason: "total price discrepancy", category: "Invoice Issue", penalty_amount: 15000, issue: "PO or Invoice data not found" },
            { po_id: "PO1102", reason: "asn/grn mismatch", category: "GRN Issue", penalty_amount: 12000, issue: "PO or GRN data not found" },
            { po_id: "PO1110", reason: "invoice/grn quantity mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=178, GRN=205" },
            { po_id: "PO1114", reason: "currency mismatch", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Qty mismatch: PO=173, GRN=98" },
            { po_id: "PO1121", reason: "under-delivery", category: "Quantity Mismatch", penalty_amount: 8500, issue: "Under-delivery: PO=183, GRN=167" },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#ef4444";
      case "in-progress":
        return "#f59e0b";
      case "resolved":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const getStatusLabel = (status) => {
    return status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <Box sx={{ p: 4 }}>
      {error && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          <Typography sx={{ color: "#991b1b", fontSize: "0.9rem" }}>
            ⚠️ {error} - Using fallback data
          </Typography>
        </Box>
      )}
      
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Typography sx={{ color: "#64748b", fontSize: "1.1rem" }}>Loading analytics...</Typography>
        </Box>
      )}

      {!loading && poData && (
        <Stack spacing={4}>
        {/* Recovery Opportunity Section - PRIMARY FOCUS */}
        <Card
          sx={{
            border: "2px solid #7c3aed",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
            backgroundColor: "#f5f3ff",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>
                  � PO Health & Discrepancy Analysis
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Export Report
                </Button>
              </Stack>

              {/* PO Health KPIs */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Total POs
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#4f46e5" }}>
                        {poData.totalPOs}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 1 }}>
                        All purchases
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Without Issues
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>
                        {poData.posWithoutIssues}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 1 }}>
                        {((poData.posWithoutIssues / poData.totalPOs) * 100).toFixed(1)}% clean
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        With Issues
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444" }}>
                        {poData.posWithIssues}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 1 }}>
                        {((poData.posWithIssues / poData.totalPOs) * 100).toFixed(1)}% flagged
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Resolved
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed" }}>
                        {poData.correctWithIssues}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748b", mt: 1 }}>
                        {((poData.correctWithIssues / poData.posWithIssues) * 100).toFixed(1)}% recovery rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Potential Recovery Highlight */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: "12px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #4f46e5",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "#4f46e5", fontSize: "0.9rem", fontWeight: 600, mb: 1 }}>
                  💰 Potential Recovery from Discrepancies
                </Typography>
                <Typography sx={{ fontSize: "2.5rem", fontWeight: 900, color: "#4f46e5" }}>
                  ₹{(poData.potentialRecoveryAmount / 100000).toFixed(2)}L
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#64748b", mt: 1 }}>
                  from {poData.withDiscrepancies} POs needing resolution
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Standard KPI Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <KPICard
              title="Total Issues"
              value={issueStats.total}
              icon={AssignmentIcon}
              color="#4f46e5"
              trend={8}
              trendLabel="this month"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KPICard
              title="Open Issues"
              value={issueStats.open}
              icon={WarningIcon}
              color="#ef4444"
              trend={12}
              trendLabel="pending"
              subtext="⚠️ Requires action"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KPICard
              title="In Progress"
              value={issueStats.inProgress}
              icon={TrendingUpIcon}
              color="#f59e0b"
              trend={-2}
              trendLabel="from last week"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <KPICard
              title="Resolved"
              value={issueStats.resolved}
              icon={CheckCircleIcon}
              color="#10b981"
              trend={15}
              trendLabel="this month"
            />
          </Grid>
        </Grid>

        {/* Recovery Opportunity by Category */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                💵 Discrepancy Recovery by Category
              </Typography>
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                sx={{ color: "#4f46e5", textTransform: "none", fontWeight: 600 }}
                onClick={() => setDetailsOpen(true)}
              >
                View Details
              </Button>
            </Stack>
            <Stack spacing={2.5}>
              {discrepancyBreakdown.map((item) => {
                const percentage = (item.totalRecovery / poData.potentialRecoveryAmount) * 100;
                return (
                  <Box key={item.category}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#1f2937" }}>
                          {item.category}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {item.posCount} POs × ₹{(item.avgRecoveryPerPO / 1000).toFixed(1)}K avg
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#ef4444", minWidth: 90 }}>
                          ₹{(item.totalRecovery / 100000).toFixed(2)}L
                        </Typography>
                        <Typography sx={{ fontSize: "0.85rem", color: "#64748b", minWidth: 40 }}>
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: "4px",
                        backgroundColor: "#e5e7eb",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: "4px",
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Top 5 Charts - Side by Side */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Pie Chart */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", mb: 2 }}>
                  💰 Top 5 POs by Recovery
                </Typography>
                {topPos.topRecoveryPOS && topPos.topRecoveryPOS.length > 0 ? (
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={topPos.topRecoveryPOS}
                          dataKey="recovery_amount"
                          nameKey="po_id"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ po_id }) => `${po_id}`}
                          labelLine={true}
                        >
                          <Cell fill="#4f46e5" />
                          <Cell fill="#7c3aed" />
                          <Cell fill="#06b6d4" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : null}
              </Grid>

              {/* Bar Chart */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", mb: 2 }}>
                  ⚠️ Top 5 POs with Penalties
                </Typography>
                {topPos.topPenaltyPOS && topPos.topPenaltyPOS.length > 0 ? (
                  <Box>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topPos.topPenaltyPOS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="po_id" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip 
                          formatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                          contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
                        />
                        <Bar dataKey="penalty_amount" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : null}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Detailed Recovery Table */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", mb: 3 }}>
              � PO Discrepancy Breakdown by Category
            </Typography>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f1f5fe", borderBottom: "2px solid #cbd5e1" }}>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Issue Category
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      POs Affected
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Avg Recovery/PO
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Total Recovery Potential
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      % of Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discrepancyBreakdown.map((item, idx) => {
                    const percentage = (item.totalRecovery / poData.potentialRecoveryAmount) * 100;
                    return (
                      <TableRow
                        key={item.category}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderBottom: "1px solid #e5e7eb",
                          transition: "all 0.2s ease",
                          "&:hover": { backgroundColor: "#f1f5fe" },
                        }}
                      >
                        <TableCell sx={{ fontSize: "0.95rem", color: "#1f2937", fontWeight: 600 }}>
                          {item.category}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#4f46e5", fontWeight: 700 }}>
                          {item.posCount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#f59e0b", fontWeight: 600 }}>
                          ₹{(item.avgRecoveryPerPO / 1000).toFixed(1)}K
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#ef4444", fontWeight: 700 }}>
                          ₹{(item.totalRecovery / 100000).toFixed(2)}L
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>
                          {percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ backgroundColor: "#f0f9ff", borderTop: "2px solid #cbd5e1" }}>
                    <TableCell sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 700 }}>
                      TOTAL
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 700 }}>
                      {discrepancyBreakdown.reduce((sum, item) => sum + item.posCount, 0)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 700 }}>
                      ₹{(discrepancyBreakdown.reduce((sum, item) => sum + item.avgRecoveryPerPO, 0) / discrepancyBreakdown.length / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 700 }}>
                      ₹{(poData.potentialRecoveryAmount / 100000).toFixed(2)}L
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 700 }}>
                      100%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Key Insights & Recommendations */}
        <Box sx={{ p: 3, backgroundColor: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd" }}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: "0.9rem", color: "#0c4a6e", fontWeight: 600 }}>
              📈 Key Insights & Action Items
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", color: "#0c4a6e", lineHeight: 1.8 }}>
              • <strong>PO Health: {((poData.posWithoutIssues / poData.totalPOs) * 100).toFixed(1)}% clean</strong> - {poData.posWithoutIssues} POs processed without issues<br/>
              • <strong>{poData.withDiscrepancies} POs need resolution</strong> - {((poData.withDiscrepancies / poData.totalPOs) * 100).toFixed(1)}% of total require discrepancy handling<br/>
              • <strong>₹{(poData.potentialRecoveryAmount / 100000).toFixed(2)}L at stake</strong> - Potential recovery if all discrepancies resolved<br/>
              • <strong>Top recovery opportunity:</strong> {discrepancyBreakdown.length > 0 ? `${discrepancyBreakdown[0].category}: ₹${(discrepancyBreakdown[0].totalRecovery / 100000).toFixed(2)}L from ${discrepancyBreakdown[0].posCount} POs` : "Loading..."}<br/>
              • <strong>{poData.correctWithIssues} POs resolved despite flagged issues</strong> - {((poData.correctWithIssues / poData.posWithIssues) * 100).toFixed(1)}% success rate on issue resolution
            </Typography>
          </Stack>
        </Box>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem", borderBottom: "1px solid #e5e7eb" }}>
            Discrepancy Recovery Breakdown
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2}>
              {discrepancyBreakdown.map((item) => (
                <Box key={item.category} sx={{ p: 2, backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography sx={{ fontSize: "0.9rem", color: "#166534", fontWeight: 600 }}>
                      {item.category}
                    </Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#16a34a", fontWeight: 700 }}>
                      ₹{(item.totalRecovery / 100000).toFixed(2)}L
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: "0.8rem", color: "#166534" }}>
                    {item.posCount} POs × ₹{(item.avgRecoveryPerPO / 1000).toFixed(1)}K avg recovery per PO
                  </Typography>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb" }}>
            <Button onClick={() => setDetailsOpen(false)} sx={{ color: "#64748b", textTransform: "none" }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;