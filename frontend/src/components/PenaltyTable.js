import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  Chip
} from '@mui/material';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'PO_ID', label: 'PO ID' },
  { id: 'reason', label: 'Reason' },
  { id: 'match', label: 'Match Status' },
  { id: 'penalty', label: 'Penalty Amount ($)' },
  { id: 'saveable', label: 'Saveable' },
  { id: 'comments', label: 'Comments' },
];

function PenaltyTable({ validationData, reasonsData }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('penalty');
  const [debugMode, setDebugMode] = useState(true);

  // Helper function to get clean reason string
  const normalizeReason = (reason) => {
    return reason ? reason.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  };

  // Create merged data with penalties
  const mergedData = validationData.map(vRow => {
    // Get normalized values for case-insensitive comparison
    const normalizedStatedReason = normalizeReason(vRow.stated_reason);
    
    // First try exact match by PO_ID and reason
    const reasonRow = reasonsData.find(r => {
      const normalizedReason = normalizeReason(r.reason);
      return r.PO_ID === vRow.PO_ID && normalizedReason === normalizedStatedReason;
    });
    
    // If no match found, try matching just by PO_ID (fallback approach)
    const poMatchedReasonRow = !reasonRow ? 
      reasonsData.find(r => r.PO_ID === vRow.PO_ID) : null;
      
    // Use the best match we found
    const bestMatch = reasonRow || poMatchedReasonRow;
    
    // Log for debugging
    if (debugMode) {

    }
    
    // Ensure penalty is a proper number
    const penalty = bestMatch ? parseFloat(bestMatch.penalty || 0) : 0;
    const matchStatus = vRow["Match/Not"];
    const isMatch = String(matchStatus).toLowerCase() === "true";
    
    // "No Match" means supplier charged incorrectly, so we can save this penalty
    const isSaveable = !isMatch && matchStatus !== "N/A" && penalty > 0;
    
    return {
      PO_ID: vRow.PO_ID,
      reason: vRow.stated_reason,
      match: matchStatus,
      penalty: penalty,
      saveable: isSaveable,
      comments: vRow.Comments
    };
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - mergedData.length) : 0;

  const visibleRows = stableSort(mergedData, getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Typography
          sx={{ p: 2 }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Penalty Analysis by PO & Reason
        </Typography>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="penalty table" size="small">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((row, index) => (
                <TableRow
                  hover
                  key={`${row.PO_ID}-${index}`}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: row.match === "True" 
                      ? 'rgba(232, 245, 233, 0.5)' 
                      : row.saveable 
                        ? 'rgba(255, 235, 238, 0.3)' 
                        : 'inherit'
                  }}
                >
                  <TableCell>{row.PO_ID}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.match} 
                      color={row.match === "True" ? "success" : row.match === "False" ? "error" : "default"} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px'
                      // Removed backgroundColor, boxShadow, animation, and keyframes for subtle style
                    }}>
                      <Typography
                        component="span"
                        fontWeight={row.saveable ? 600 : 400}
                        color={row.saveable ? "error.main" : "text.primary"}
                      >
                        ${row.penalty.toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.saveable ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.comments}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 33 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={mergedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

export default PenaltyTable;
