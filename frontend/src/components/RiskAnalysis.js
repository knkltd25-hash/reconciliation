import React, { useState } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Stack,
	Tooltip as MuiTooltip,
	Button
} from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Expanded mock PO data for SaaS demo
const mockPOs = Array.from({ length: 25 }, (_, i) => {
	const base = [
		{
			risk: "Late Delivery",
			action: "Ask driver to fasten vehicle",
			risk_level: "High",
			dock_available: true,
			can_transfer: true,
			ordered_qty: 15000,
			available_qty: 13000,
			transit_hours: 35,
		},
		{
			risk: "Truck Detention",
			action: "Alert: Gate-in not possible, risk of detention penalty",
			risk_level: "Medium",
			dock_available: false,
			can_transfer: false,
			ordered_qty: 8000,
			available_qty: 8000,
			transit_hours: 8,
		},
		{
			risk: "Not In-Full",
			action: "No stock transfer possible. Only 3K will be delivered.",
			risk_level: "High",
			dock_available: true,
			can_transfer: false,
			ordered_qty: 15000,
			available_qty: 3000,
			transit_hours: 10,
		},
		{
			risk: "None",
			action: "On track",
			risk_level: "Low",
			dock_available: true,
			can_transfer: true,
			ordered_qty: 12000,
			available_qty: 12000,
			transit_hours: 6,
		},
		{
			risk: "Not In-Full",
			action: "Do stock transfer from nearest DC",
			risk_level: "Medium",
			dock_available: true,
			can_transfer: true,
			ordered_qty: 9000,
			available_qty: 7000,
			transit_hours: 12,
		},
	];
	const b = base[i % base.length];
	return {
		po_id: `PO${1001 + i}`,
		product: `Product ${String.fromCharCode(65 + (i % 5))}`,
		source_dc: `DC-${String.fromCharCode(65 + (i % 5))}`,
		dest_dc: `WH-${1 + (i % 5)}`,
		dispatch_time: `2026-02-24T${String(7 + (i % 12)).padStart(2, '0')}:00:00Z`,
		required_delivery: `2026-02-25T${String(10 + (i % 12)).padStart(2, '0')}:00:00Z`,
		...b,
	};
});

const riskColors = {
	High: "#ef4444",
	Medium: "#f59e0b",
	Low: "#10b981",
	None: "#64748b"
};

const RiskAnalysis = () => {
	const [pos] = useState(mockPOs);

	// SaaS-style actionable summary
	const totalPOs = pos.length;
	const highRisk = pos.filter(po => po.risk_level === "High").length;
	const mediumRisk = pos.filter(po => po.risk_level === "Medium").length;
	const lowRisk = pos.filter(po => po.risk_level === "Low").length;
	const noRisk = pos.filter(po => po.risk_level === "None").length;

	// Funnel data for supply chain risk
	const funnelData = [
		{ stage: "All POs", value: totalPOs },
		{ stage: "At Risk (Any)", value: highRisk + mediumRisk },
		{ stage: "High Risk", value: highRisk },
		{ stage: "Actionable", value: pos.filter(po => po.risk_level === "High" && po.action !== "On track").length },
	];

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
				PO Risk Table
			</Typography>
			<Card>
				<CardContent>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>PO ID</TableCell>
									<TableCell>Product</TableCell>
									<TableCell>Ordered Qty</TableCell>
									<TableCell>Available Qty</TableCell>
									<TableCell>Source DC</TableCell>
									<TableCell>Dest DC</TableCell>
									<TableCell>Dispatch</TableCell>
									<TableCell>Required Delivery</TableCell>
									<TableCell>Transit (hrs)</TableCell>
									<TableCell>Dock</TableCell>
									<TableCell>Risk</TableCell>
									<TableCell>Action</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{pos.map((po) => (
									<TableRow key={po.po_id}>
										<TableCell>{po.po_id}</TableCell>
										<TableCell>{po.product}</TableCell>
										<TableCell>{po.ordered_qty}</TableCell>
										<TableCell>{po.available_qty}</TableCell>
										<TableCell>{po.source_dc}</TableCell>
										<TableCell>{po.dest_dc}</TableCell>
										<TableCell>{new Date(po.dispatch_time).toLocaleString()}</TableCell>
										<TableCell>{new Date(po.required_delivery).toLocaleString()}</TableCell>
										<TableCell>{po.transit_hours}</TableCell>
										<TableCell>
											{po.dock_available ? (
												<MuiTooltip title="Dock Available"><CheckCircleIcon sx={{ color: '#10b981' }} /></MuiTooltip>
											) : (
												<MuiTooltip title="Dock Not Available"><ErrorOutlineIcon sx={{ color: '#ef4444' }} /></MuiTooltip>
											)}
										</TableCell>
										<TableCell>{po.risk}</TableCell>
										<TableCell>{po.action}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
		</Box>
	);
};

export default RiskAnalysis;
