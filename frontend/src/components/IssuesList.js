import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Collapse,
  IconButton,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// Mock issues data - fallback if API fails
const mockIssuesData = [];

const IssuesList = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPOID, setSearchPOID] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAlignment, setFilterAlignment] = useState("all");


  const assignees = ["Clay", "Moore", "Elizabeth"];
  const categories = [
    "Invoice Issue",
    "GRN Issue",
    "Quantity Mismatch",
    "Shipping Issue",
    "Late Delivery Issue",
    "Unspecified Issue",
  ];

  // Unique PO IDs for filter dropdown
  const uniquePOIDs = Array.from(new Set(issues.map(issue => issue.po_id))).sort();
  const [filterPOID, setFilterPOID] = useState("all");

  // Assign random assignee
  const getRandomAssignee = () => {
    return assignees[Math.floor(Math.random() * assignees.length)];
  };

  // Fetch PO-level issues on component mount
  useEffect(() => {
    const fetchPOIssues = async () => {
      try {
        const response = await fetch("http://54.145.92.198:8000/api/po-level-issues");
        if (response.ok) {
          const data = await response.json();
          if (data.status === "success") {
            // Transform PO-level data with random assignees
            const poIssues = data.poWithIssues.map((po, idx) => ({
              id: idx,
              po_id: po.po_id,
              stated_reason: po.stated_reason,
              category: po.category,
              comments: po.comments,
              penalty_amount: po.penalty_amount || 0,
              alignment: po.alignment || "Yes",
              assignee: getRandomAssignee(),
              status: "open",
            }));
            setIssues(poIssues);
          }
        }
      } catch (e) {
        setError("Could not load issue data");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPOIssues();
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const getStatusLabel = (status) => {
    return status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  // Filter issues based on search and filter criteria
  const filteredIssues = issues.filter((issue) => {
    const matchesPOID =
      (filterPOID === "all" || issue.po_id === filterPOID) &&
      issue.po_id.toLowerCase().includes(searchPOID.toLowerCase());
    const matchesCategory = filterCategory === "all" || issue.category === filterCategory;
    const matchesAssignee = filterAssignee === "all" || issue.assignee === filterAssignee;
    const matchesStatus = filterStatus === "all" || issue.status === filterStatus;
    const matchesAlignment = filterAlignment === "all" || issue.alignment === filterAlignment;
    return matchesPOID && matchesCategory && matchesAssignee && matchesStatus && matchesAlignment;
  });

  // Reset filters
  const handleResetFilters = () => {
    setSearchPOID("");
    setFilterCategory("all");
    setFilterAssignee("all");
    setFilterStatus("all");
    setFilterAlignment("all");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography sx={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", mb: 1 }}>
            📋 Issue Tracking
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", color: "#64748b" }}>
            Manage and track all flagged discrepancies at PO level
          </Typography>
        </Box>

        {/* Filters and Search */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)", p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <FilterListIcon sx={{ fontSize: "1.2rem", color: "#4f46e5" }} />
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>
                Filters
              </Typography>
            </Stack>
            
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexWrap: "wrap" }}>

              {/* PO ID Filter Dropdown */}
              <TextField
                select
                label="PO ID"
                value={filterPOID}
                onChange={(e) => setFilterPOID(e.target.value)}
                size="small"
                sx={{ minWidth: "180px" }}
              >
                <MenuItem value="all">All PO IDs</MenuItem>
                {uniquePOIDs.map((poid) => (
                  <MenuItem key={poid} value={poid}>{poid}</MenuItem>
                ))}
              </TextField>

              {/* Search by PO ID (text) */}
              <TextField
                placeholder="Search by PO ID..."
                size="small"
                value={searchPOID}
                onChange={(e) => setSearchPOID(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: "200px",
                  "& .MuiOutlinedInput-root": {
                    borderColor: "#e5e7eb",
                  },
                }}
              />
              
              {/* Category Filter */}
              <TextField
                select
                label="Category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                size="small"
                sx={{ minWidth: "180px" }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
              
              {/* Assignee Filter */}
              <TextField
                select
                label="Assigned To"
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                size="small"
                sx={{ minWidth: "180px" }}
              >
                <MenuItem value="all">All Assignees</MenuItem>
                {assignees.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
                  </MenuItem>
                ))}
              </TextField>
              
              {/* Status Filter */}
              <TextField
                select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                size="small"
                sx={{ minWidth: "180px" }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </TextField>
              
              {/* Alignment Filter */}
              <TextField
                select
                label="Alignment"
                value={filterAlignment}
                onChange={(e) => setFilterAlignment(e.target.value)}
                size="small"
                sx={{ minWidth: "180px" }}
              >
                <MenuItem value="all">All Alignments</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
              
              {/* Reset Filters Button */}
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{
                  color: "#4f46e5",
                  borderColor: "#4f46e5",
                  fontWeight: 600,
                  marginLeft: "auto",
                  "&:hover": {
                    backgroundColor: "#f0f9ff",
                    borderColor: "#4f46e5",
                  },
                }}
              >
                Clear Filters
              </Button>
            </Stack>
            
            {/* Filter Results Summary */}
            <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
              {error ? `⚠️ ${error}` : `Showing ${filteredIssues.length} of ${issues.length} issues`}
            </Typography>
          </Stack>
        </Card>

        {/* Issues Table */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
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
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    PO ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Reason
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Model Comments
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Alignment
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Penalty
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Assigned To
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      backgroundColor: "#f1f5fe",
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredIssues.length > 0 ? (
                  filteredIssues.map((issue, idx) => (
                    <TableRow
                      key={issue.id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                        transition: "all 0.2s ease",
                        "&:hover": { backgroundColor: "#f1f5fe" },
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#4f46e5" }}>
                        {issue.po_id}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", fontWeight: 500, color: "#1f2937" }}>
                        {issue.stated_reason}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", color: "#64748b" }}>
                        {issue.category}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", color: "#1f2937", maxWidth: "300px" }}>
                        {issue.comments}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
                        <Chip
                          label={issue.alignment}
                          size="small"
                          sx={{
                            backgroundColor: issue.alignment === "Yes" ? "#10b98120" : "#ef444420",
                            color: issue.alignment === "Yes" ? "#10b981" : "#ef4444",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#ef4444" }}>
                        ₹{issue.penalty_amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
                        {issue.assignee}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(issue.status)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(issue.status) + "20",
                            color: getStatusColor(issue.status),
                            fontWeight: 600,
                            fontSize: "0.8rem",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.95rem" }}>
                        {issues.length === 0 ? "No issues found." : "No issues match your filters."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Loading issues...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </Box>
  );
};

export default IssuesList;
