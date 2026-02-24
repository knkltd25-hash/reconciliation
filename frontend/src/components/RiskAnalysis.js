import React from "react";
import { Box, Typography } from "@mui/material";

const RiskAnalysis = () => (
	<Box sx={{ p: 4 }}>
		<Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
			PO Risk Analysis
		</Typography>
		<Typography variant="body1" sx={{ color: '#64748b' }}>
			This is the prediction tab. Implement your PO risk analysis logic here.
		</Typography>
	</Box>
);

export default RiskAnalysis;
