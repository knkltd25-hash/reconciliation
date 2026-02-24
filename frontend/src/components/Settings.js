import React, { useState, useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { AuthContext } from "../context/AuthContext";

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profileSettings, setProfileSettings] = useState({
    username: user?.username || "John Doe",
    email: user?.email || "john@example.com",
    department: "Finance",
    role: "Finance Manager",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    issueAlerts: true,
    dailyDigest: true,
    slackNotifications: true,
  });

  const [organizationSettings, setOrganizationSettings] = useState({
    orgName: "Acme Corp",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
  });

  const handleProfileChange = (field, value) => {
    setProfileSettings({ ...profileSettings, [field]: value });
  };

  const handleNotificationChange = (field) => {
    setNotificationSettings({ ...notificationSettings, [field]: !notificationSettings[field] });
  };

  const handleOrgChange = (field, value) => {
    setOrganizationSettings({ ...organizationSettings, [field]: value });
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        {/* Success Message */}
        {saveSuccess && (
          <Alert severity="success" onClose={() => setSaveSuccess(false)} sx={{ borderRadius: "10px" }}>
            ✓ Settings saved successfully!
          </Alert>
        )}

        {/* Profile Settings */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", mb: 3 }}>
              👤 Profile Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Username"
                  value={profileSettings.username}
                  onChange={(e) => handleProfileChange("username", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={profileSettings.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  value={profileSettings.department}
                  onChange={(e) => handleProfileChange("department", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Role"
                  value={profileSettings.role}
                  onChange={(e) => handleProfileChange("role", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", mb: 3 }}>
              🔔 Notification Preferences
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={() => handleNotificationChange("emailNotifications")}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>Email Notifications</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Receive email alerts for important issues
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.issueAlerts}
                    onChange={() => handleNotificationChange("issueAlerts")}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>Issue Alerts</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Get notified when new issues are flagged
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.dailyDigest}
                    onChange={() => handleNotificationChange("dailyDigest")}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>Daily Digest</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Receive daily summary of issues (8 AM)
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.slackNotifications}
                    onChange={() => handleNotificationChange("slackNotifications")}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "#1f2937" }}>Slack Notifications</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Send notifications to your Slack channel
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", mb: 3 }}>
              🏢 Organization Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Organization Name"
                  value={organizationSettings.orgName}
                  onChange={(e) => handleOrgChange("orgName", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Timezone"
                  value={organizationSettings.timezone}
                  onChange={(e) => handleOrgChange("timezone", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="CST">CST</option>
                  <option value="PST">PST</option>
                  <option value="IST">IST</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Date Format"
                  value={organizationSettings.dateFormat}
                  onChange={(e) => handleOrgChange("dateFormat", e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card sx={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
          <CardContent>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", mb: 3 }}>
              🔒 Data & Privacy
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ p: 2, backgroundColor: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                <Typography sx={{ fontSize: "0.9rem", color: "#0c4a6e", fontWeight: 600, mb: 1 }}>
                  Data Retention
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#0c4a6e" }}>
                  Historical data is retained for 12 months. Older data is automatically archived.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: "#cbd5e1",
                    color: "#64748b",
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      borderColor: "#64748b",
                      backgroundColor: "#f1f5fe",
                    },
                  }}
                >
                  Export Data
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      borderColor: "#ef4444",
                      backgroundColor: "#fee2e2",
                    },
                  }}
                >
                  Delete Account
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          size="large"
          sx={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            color: "white",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            py: 1.5,
          }}
        >
          Save All Settings
        </Button>
      </Stack>
    </Box>
  );
};

export default Settings;
