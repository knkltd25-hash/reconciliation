import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import PenaltyReviewTable from "./PenaltyReviewTable";
import { apiCall } from "../utils/api";
import { BACKEND_URL } from "../utils/backend";

const AdminDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [approvals, setApprovals] = useState({});
  
  // Filter states
  const [filterReason, setFilterReason] = useState("");
  const [filterPenalty, setFilterPenalty] = useState("");
  const [reasonOptions, setReasonOptions] = useState([]);
  const [penaltyStats, setPenaltyStats] = useState({ p33: 0, p66: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch validation results as text (CSV)
      const validationRes = await fetch(`${BACKEND_URL}/results/final_reason_validation_results.csv`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const validationText = await validationRes.text();

      // Fetch reasons data as text (CSV)
      const reasonsRes = await fetch(`${BACKEND_URL}/results/reasons.csv`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const reasonsText = await reasonsRes.text();

      // Parse CSV
      const parseCSV = (csv) => {
        const [header, ...rows] = csv.trim().split(/\r?\n/);
        const keys = header.split(",");
        return rows.map((row) => {
          const values = row
            .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
            .map((v) => v.replace(/^"|"$/g, ""));
          const obj = {};
          keys.forEach((k, i) => (obj[k] = values[i]));
          return obj;
        });
      };

      const validationData = parseCSV(validationText);
      const reasonsData = parseCSV(reasonsText);

      // Merge validation and reasons data
      const mergedData = reasonsData.map((reason) => {
        const validation = validationData.find(
          (v) => v.PO_ID === reason.PO_ID
        );
        return {
          ...reason,
          validation_status: validation?.["Match/Not"] === "True" ? "Valid" : "Discrepancy",
          validation_comments: validation?.Comments || "",
          admin_approved: reason.admin_approved === "True" || reason.admin_approved === true,
          admin_comments: reason.admin_comments || "",
        };
      });

      setData(mergedData);
      applyFilters(mergedData);
      
      // Extract unique reasons and calculate penalty percentiles
      const reasons = [...new Set(mergedData.map(d => d.stated_reason).filter(Boolean))];
      setReasonOptions(reasons.sort());
      
      // Calculate penalty percentiles
      const penalties = mergedData
        .map(d => parseFloat(d.penalty) || 0)
        .filter(p => p > 0)
        .sort((a, b) => a - b);
      
      if (penalties.length > 0) {
        const p33Idx = Math.ceil(penalties.length * 0.33) - 1;
        const p66Idx = Math.ceil(penalties.length * 0.66) - 1;
        setPenaltyStats({
          p33: penalties[Math.max(0, p33Idx)],
          p66: penalties[Math.max(0, p66Idx)],
        });
      }
    } catch (error) {
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (dataToFilter) => {
    let result = dataToFilter;
    
    // Filter by reason
    if (filterReason) {
      result = result.filter(item => item.stated_reason === filterReason);
    }
    
    // Filter by penalty percentile
    if (filterPenalty && penaltyStats.p33 > 0) {
      const penalty = parseFloat(dataToFilter[0]?.penalty) || 0;
      result = result.filter(item => {
        const p = parseFloat(item.penalty) || 0;
        if (filterPenalty === "high") return p > penaltyStats.p66;
        if (filterPenalty === "medium") return p >= penaltyStats.p33 && p <= penaltyStats.p66;
        if (filterPenalty === "low") return p < penaltyStats.p33 && p > 0;
        return true;
      });
    }
    
    setFilteredData(result);
  };

  // Apply filters whenever filter values or data changes
  useEffect(() => {
    if (data.length > 0) {
      applyFilters(data);
    }
  }, [filterReason, filterPenalty, penaltyStats]);

  const handleApprovalChange = (poId, approved) => {
    setApprovals({
      ...approvals,
      [poId]: {
        ...approvals[poId],
        approved,
      },
    });
  };

  const handleCommentsChange = (poId, comments) => {
    setApprovals({
      ...approvals,
      [poId]: {
        ...approvals[poId],
        comments,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const result = await apiCall("/save-penalty-approvals", {
        method: "POST",
        body: JSON.stringify(approvals),
      });

      if (result.status === "success") {
        setMessage("Approvals saved successfully!");
        setApprovals({});
        setTimeout(() => fetchData(), 1000);
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
        py: 2,
      }}
    >
      <Card
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          mb: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #e8eaed",
          m: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#000",
              mb: 1,
            }}
          >
            Penalty Review & Approval
          </Typography>
          <Typography variant="body2" sx={{ color: "#5f6368", mb: 3 }}>
            Review and approve penalties with detailed validation information
          </Typography>

          {/* Filters Section */}
          <Box
            sx={{
              backgroundColor: "#f8f9fb",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 2.5,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#2d3748", display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon sx={{ fontSize: 20, color: "#667eea" }} />
                Filters
              </Typography>
              
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

              {(filterReason || filterPenalty) && (
                <Button
                  size="small"
                  onClick={() => {
                    setFilterReason("");
                    setFilterPenalty("");
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

              <Typography variant="caption" sx={{ ml: "auto", color: "#718096", fontWeight: 500 }}>
                Showing {filteredData.length} of {data.length} records
              </Typography>
            </Stack>
          </Box>          {message && (
            <Alert
              severity={message.includes("successfully") ? "success" : "error"}
              sx={{ mb: 2 }}
            >
              {message}
            </Alert>
          )}

          <PenaltyReviewTable
            data={filteredData}
            onApprovalChange={handleApprovalChange}
            onCommentsChange={handleCommentsChange}
            approvals={approvals}
          />

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving || Object.keys(approvals).length === 0}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              {saving ? "Saving..." : "Save Approvals"}
            </Button>
            <Button
              variant="outlined"
              onClick={fetchData}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
