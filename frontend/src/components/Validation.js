import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import ValidationKPIs from "./ValidationKPIs";
import { BACKEND_URL } from "../utils/backend";

function Validation() {
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");
  const [refresh, setRefresh] = useState(0);

  const handleRunWorkflow = async () => {
    setRunning(true);
    setRunMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/run-validation`, { method: "POST" });
      const data = await res.json();
      setRunMsg(data.status === "success" ? "Validation workflow completed!" : "Workflow failed.");
      setRefresh(r => r + 1); // trigger refresh
    } catch (e) {
      setRunMsg("Error running workflow.");
    }
    setRunning(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
  <Typography variant="h5" fontWeight={600}>Discrepancy Validator</Typography>
        <Button variant="contained" color="primary" onClick={handleRunWorkflow} disabled={running}>
          {running ? "Running..." : "Run Workflow"}
        </Button>
      </Box>
      {runMsg && <Typography color="secondary" mb={2}>{runMsg}</Typography>}
      <ValidationKPIs refresh={refresh} />
    </Box>
  );
}

export default Validation;
