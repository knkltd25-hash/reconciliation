import React from "react";
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import LabelIcon from '@mui/icons-material/Label';
import VerifiedIcon from '@mui/icons-material/Verified';
import SummarizeIcon from '@mui/icons-material/Summarize';

const options = [
  { key: "tagging", label: "Potential Risk Flagger", icon: <LabelIcon /> },
  { key: "validation", label: "Discrepancy Validator", icon: <VerifiedIcon /> },
];
const userGuideOption = { key: "summary", label: "User Guide", icon: <SummarizeIcon /> };

function Sidebar({ selected, onSelect }) {
  return (
    <Box sx={{ width: 240, background: '#fff', height: '100vh', boxShadow: 2, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
        <Typography variant="h5" fontWeight={700} color="#1a237e">Reconciliation Assistant</Typography>
      </Box>
      <List sx={{ flex: 1 }}>
        {options.map((opt) => (
          <ListItem
            button
            key={opt.key}
            selected={selected === opt.key}
            onClick={() => onSelect(opt.key)}
            sx={{
              background: selected === opt.key ? '#e3f2fd' : 'inherit',
              color: selected === opt.key ? '#1976d2' : 'inherit',
              '&:hover': { background: '#e3f2fd' },
            }}
          >
            <ListItemIcon sx={{ color: selected === opt.key ? '#1976d2' : '#757575' }}>{opt.icon}</ListItemIcon>
            <ListItemText primary={opt.label} />
          </ListItem>
        ))}
      </List>
      <List sx={{ mb: 2 }}>
        <ListItem
          button
          key={userGuideOption.key}
          selected={selected === userGuideOption.key}
          onClick={() => onSelect(userGuideOption.key)}
          sx={{
            background: selected === userGuideOption.key ? '#e3f2fd' : 'inherit',
            color: selected === userGuideOption.key ? '#1976d2' : 'inherit',
            '&:hover': { background: '#e3f2fd' },
          }}
        >
          <ListItemIcon sx={{ color: selected === userGuideOption.key ? '#1976d2' : '#757575' }}>{userGuideOption.icon}</ListItemIcon>
          <ListItemText primary={userGuideOption.label} />
        </ListItem>
      </List>
    </Box>
  );
}

export default Sidebar;
