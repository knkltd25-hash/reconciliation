import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Checkbox,
  TextField,
  Box,
  Chip,
} from "@mui/material";

const PenaltyReviewTable = ({
  data,
  onApprovalChange,
  onCommentsChange,
  approvals,
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: "8px",
        border: "1px solid #e8eaed",
        maxHeight: "600px",
        overflow: "auto",
      }}
    >
      <Table stickyHeader>
        <TableHead sx={{ backgroundColor: "#f5f7fa" }}>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              PO ID
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Reason
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Penalty Amount
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Validation Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Validation Comments
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Approve
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: "#f5f7fa",
                borderBottom: "2px solid #e8eaed",
              }}
            >
              Admin Comments
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                "&:hover": {
                  backgroundColor: "#f0f4f8",
                },
                borderBottom: "1px solid #e8eaed",
              }}
            >
              <TableCell sx={{ fontWeight: "500" }}>{row.PO_ID}</TableCell>
              <TableCell>{row.reason || "No reason"}</TableCell>
              <TableCell align="right">
                ${parseFloat(row.penalty || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <Chip
                  label={row.validation_status}
                  color={row.validation_status === "Valid" ? "success" : "warning"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell sx={{ fontSize: "12px", maxWidth: "200px" }}>
                {row.validation_comments}
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={approvals[row.PO_ID]?.approved || row.admin_approved || false}
                  onChange={(e) =>
                    onApprovalChange(row.PO_ID, e.target.checked)
                  }
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Add comments..."
                  multiline
                  maxRows={2}
                  fullWidth
                  value={approvals[row.PO_ID]?.comments || row.admin_comments || ""}
                  onChange={(e) =>
                    onCommentsChange(row.PO_ID, e.target.value)
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: "12px",
                    },
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PenaltyReviewTable;
