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

// Mock PO data with risk scenarios
const mockPOs = [
	{
		po_id: "PO1001",
		product: "Product A",
		ordered_qty: 15000,
		available_qty: 13000,
		source_dc: "DC-A",
		dest_dc: "WH-1",
		dispatch_time: "2026-02-24T15:00:00Z",
		required_delivery: "2026-02-25T12:00:00Z",
		transit_hours: 35,
		dock_available: true,
		can_transfer: true,
		risk: "Late Delivery",
		action: "Ask driver to fasten vehicle",
		risk_level: "High"
	},
	{
		po_id: "PO1002",
		product: "Product B",
		ordered_qty: 8000,
		available_qty: 8000,
		source_dc: "DC-B",
		dest_dc: "WH-2",
		dispatch_time: "2026-02-24T10:00:00Z",
		required_delivery: "2026-02-25T18:00:00Z",
		transit_hours: 8,
		dock_available: false,
		can_transfer: false,
		risk: "Truck Detention",
		action: "Alert: Gate-in not possible, risk of detention penalty",
		risk_level: "Medium"
	},
	{
		po_id: "PO1003",
		product: "Product C",
		ordered_qty: 15000,
		available_qty: 3000,
		source_dc: "DC-C",
		dest_dc: "WH-3",
		dispatch_time: "2026-02-24T09:00:00Z",
		required_delivery: "2026-02-25T20:00:00Z",
		transit_hours: 10,
		dock_available: true,
		can_transfer: false,
		risk: "Not In-Full",
		action: "No stock transfer possible. Only 3K will be delivered.",
		risk_level: "High"
	},
	{
		po_id: "PO1004",
		product: "Product D",
		ordered_qty: 12000,
		available_qty: 12000,
		source_dc: "DC-D",
		dest_dc: "WH-4",
		dispatch_time: "2026-02-24T08:00:00Z",
		required_delivery: "2026-02-25T10:00:00Z",
		transit_hours: 6,
		dock_available: true,
		can_transfer: true,
		risk: "None",
		action: "On track",
		risk_level: "Low"
	},
	{
		po_id: "PO1005",
		product: "Product E",
		ordered_qty: 9000,
		available_qty: 7000,
		source_dc: "DC-E",
		dest_dc: "WH-5",
		dispatch_time: "2026-02-24T07:00:00Z",
		required_delivery: "2026-02-25T15:00:00Z",
		transit_hours: 12,
		dock_available: true,
		can_transfer: true,
		risk: "Not In-Full",
		action: "Do stock transfer from nearest DC",
		risk_level: "Medium"
	}
];

const riskColors = {
	High: "#ef4444",
	Medium: "#f59e0b",
	Low: "#10b981",
	None: "#64748b"
};

const RiskAnalysis = () => {
	const [pos] = useState(mockPOs);

	// Risk summary for visualization
	const riskSummary = [
		{ name: "High", count: pos.filter(po => po.risk_level === "High").length },
		{ name: "Medium", count: pos.filter(po => po.risk_level === "Medium").length },
		{ name: "Low", count: pos.filter(po => po.risk_level === "Low").length },
		{ name: "None", count: pos.filter(po => po.risk_level === "None").length }
	];

	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
				PO Risk Analysis
			</Typography>
			<Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
				Automated risk detection and action recommendations for each PO in the supply chain.
			</Typography>

			{/* Risk Level Bar Chart */}
			<Card sx={{ mb: 4, p: 2 }}>
				<CardContent>
					<Typography sx={{ fontWeight: 600, mb: 2 }}>Risk Level Distribution</Typography>
					<ResponsiveContainer width="100%" height={180}>
						<BarChart data={riskSummary} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Bar dataKey="count">
								{riskSummary.map((entry, idx) => (
									<Cell key={entry.name} fill={riskColors[entry.name]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* PO Risk Table */}
			<Card>
				<CardContent>
					<Typography sx={{ fontWeight: 600, mb: 2 }}>PO Risk Table</Typography>
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
										<TableCell>
											<Chip
												icon={po.risk_level === "High" ? <WarningIcon /> : po.risk_level === "Medium" ? <LocalShippingIcon /> : <CheckCircleIcon />}
												label={po.risk}
												sx={{ backgroundColor: riskColors[po.risk_level], color: '#fff', fontWeight: 600 }}
											/>
										</TableCell>
										<TableCell>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography sx={{ fontSize: '0.95rem', color: '#334155' }}>{po.action}</Typography>
												{po.risk_level === "High" && <Button size="small" color="error" variant="outlined">Alert</Button>}
											</Stack>
										</TableCell>
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
