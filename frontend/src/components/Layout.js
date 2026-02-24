import React, { useContext } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ChatIcon from "@mui/icons-material/Chat";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { AuthContext } from "../context/AuthContext";

const DRAWER_WIDTH = 280;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: "Chat", icon: ChatIcon, path: "/chat" },
    { label: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
    { label: "Issues", icon: AssignmentIcon, path: "/issues" },
    { label: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Logo/Branding */}
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              }}
            >
              <SmartToyIcon sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                Reconciliation
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                AI Assistant
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Navigation Menu */}
        <List sx={{ flex: 1, px: 1.5, py: 2 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItem
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  mb: 1,
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: active ? "#f1f5fe" : "transparent",
                  border: active ? "1px solid #cbd5e1" : "1px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                    borderColor: "#cbd5e1",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? "#4f46e5" : "#64748b",
                    transition: "color 0.2s ease",
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "0.95rem",
                      fontWeight: active ? 600 : 500,
                      color: active ? "#4f46e5" : "#1f2937",
                    },
                  }}
                />
              </ListItem>
            );
          })}
        </List>

        <Divider />

        {/* User Profile & Logout */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", px: 1 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.username || "User"}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email || "user@example.com"}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderColor: "#e5e7eb",
                color: "#ef4444",
                textTransform: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#ef4444",
                  backgroundColor: "#fef2f2",
                },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* TOP BAR */}
        <AppBar
          position="static"
          sx={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Toolbar sx={{ py: 1.5 }}>
            <Typography
              sx={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#0f172a",
                flex: 1,
              }}
            >
              {location.pathname === "/chat" && "Chat Assistant"}
              {location.pathname === "/dashboard" && "Dashboard"}
              {location.pathname === "/issues" && "Issue Tracking"}
              {location.pathname === "/settings" && "Settings"}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/chat")}
              sx={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Ask Me
            </Button>
          </Toolbar>
        </AppBar>

        {/* PAGE CONTENT */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#f8fafc",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
