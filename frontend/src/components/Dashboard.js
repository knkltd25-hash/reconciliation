import React from "react";
import { Box, Button, Typography, Grid, Card, CardContent } from "@mui/material";
import TaggingKPIs from "./TaggingKPIs";
import ValidationKPIs from "./ValidationKPIs";

function Dashboard({ onRunWorkflow, workflowRun }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>Business Dashboard</Typography>
        <Button variant="contained" color="primary" onClick={onRunWorkflow} disabled={workflowRun}>
          {workflowRun ? 'Running...' : 'Run Workflow'}
        </Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ minHeight: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={500} mb={2}>Reasons Tagging KPIs</Typography>
              <TaggingKPIs />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ minHeight: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={500} mb={2}>Reasons Validation KPIs</Typography>
              <ValidationKPIs />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
