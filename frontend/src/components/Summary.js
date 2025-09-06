import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Divider, Paper, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { 
  Info as InfoIcon, 
  Business as BusinessIcon, 
  Code as CodeIcon, 
  ArrowForward as ArrowForwardIcon, 
  AccountTree as AccountTreeIcon, 
  FindInPage as FindInPageIcon,
  DataObject as DataObjectIcon,
  Psychology as PsychologyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Flag as FlagIcon,
  ReceiptLong as ReceiptLongIcon,
  Category as CategoryIcon,
  SmartToy as SmartToyIcon,
  FactCheck as FactCheckIcon,
  MonetizationOn as MonetizationOnIcon,
  Savings as SavingsIcon,
  AttachMoney as AttachMoneyIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';

const Summary = () => {
  // Get current date for the refresh time
  const currentDate = new Date();
  const refreshDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;

  return (
    <Box>
      <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 700 }}>
        Reconciliation Platform
      </Typography>

      {/* Tool Summary */}
      <Card sx={{ mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1565c0' }}>
            About This Tool
          </Typography>
          <Typography variant="body1" paragraph>
            The Reconciliation Platform is a comprehensive financial recovery solution designed to identify, validate, 
            and reclaim financial losses throughout the transaction lifecycle. It combines advanced analytics with 
            machine learning to flag high-risk transactions and quantify potential recovery opportunities when 
            discrepancies are detected.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%', borderRadius: '8px' }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#2e7d32' }}>
                  <FindInPageIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                  Potential Risk Flagger
                </Typography>
                <Typography variant="body2">
                  Proactively identifies risky transactions throughout the supply chain lifecycle by analyzing
                  patterns and anomalies based on business policies and historical data. It flags potential issues 
                  before they result in financial losses.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', height: '100%', borderRadius: '8px' }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#c62828' }}>
                  <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                  Discrepancy Validator
                </Typography>
                <Typography variant="body2">
                  Validates supplier charge sheets against purchase orders and historical data to determine 
                  whether claimed discrepancies are legitimate or potentially recoverable. It helps identify 
                  significant cost recovery opportunities.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Architecture Diagrams */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>Architecture Overview</Typography>
      
      {/* Potential Risk Flagger Architecture */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32', textAlign: 'center' }}>
            Potential Risk Flagger Architecture
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 3 }}>
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <DataObjectIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Data Sources</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #2e7d32' }}>
                  <Typography variant="body2" fontWeight={600}>Metadata & Business Policies</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    Business docs, policies, and historical discrepancy patterns
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <PsychologyIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>LLM Processing</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="body2" fontWeight={600}>AI-Generated Analysis Scripts</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    LLM interprets business rules and generates analysis code
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <AutoFixHighIcon sx={{ color: '#ed6c02', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Real-time Analysis</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #ed6c02' }}>
                  <Typography variant="body2" fontWeight={600}>Transaction Data Processing</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    Live supply chain data flows through generated scripts
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <FlagIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Output</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #d32f2f' }}>
                  <Typography variant="body2" fontWeight={600}>Risk Flagging</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    Identification of high-risk transactions for proactive intervention
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
          </Stepper>
          
          {/* Enhanced Visual Architecture Diagram */}
          <Box sx={{ mt: 3, p: 3, bgcolor: '#f9f9f9', borderRadius: '12px', border: '1px solid #e0e0e0', position: 'relative' }}>
            
            {/* Main data flow with detailed structure */}
            <Grid container spacing={3} alignItems="stretch" justifyContent="center">
              {/* Data Sources Section */}
              <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#e3f2fd', 
                  borderRadius: '8px', 
                  border: '1px solid #bbdefb',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#0d47a1' }}>
                    Data Sources
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e3f2fd'
                      }}>
                        <BusinessIcon sx={{ fontSize: 24, color: '#1565c0', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Business Policies</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e3f2fd'
                      }}>
                        <DataObjectIcon sx={{ fontSize: 24, color: '#1565c0', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Historical Data</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* AI Processing Section */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#ede7f6', 
                  borderRadius: '8px', 
                  border: '1px solid #d1c4e9',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#4527a0' }}>
                    AI Processing Engine
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #ede7f6'
                      }}>
                        <PsychologyIcon sx={{ fontSize: 24, color: '#5e35b1', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Pattern Recognition</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #ede7f6'
                      }}>
                        <SmartToyIcon sx={{ fontSize: 24, color: '#5e35b1', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Code Generation</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#ffffff', borderRadius: '8px', textAlign: 'center', border: '1px solid #d1c4e9' }}>
                    <CodeIcon sx={{ fontSize: 20, color: '#5e35b1', verticalAlign: 'middle', mr: 0.5 }} />
                    <Typography variant="caption" display="inline" sx={{ fontWeight: 600 }}>
                      Dynamic Analysis Scripts
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Output Section */}
              <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#e8f5e9', 
                  borderRadius: '8px', 
                  border: '1px solid #c8e6c9',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#2e7d32' }}>
                    Risk Analytics Output
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e8f5e9'
                      }}>
                        <FlagIcon sx={{ fontSize: 32, color: '#d32f2f', mx: 'auto', mb: 1 }} />
                        <Typography variant="body2" fontWeight={600} color="error">Risk Flags</Typography>
                        <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>Prioritized by Impact</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Dashboard Section */}
            <Box sx={{ mt: 5, pt: 4, display: 'flex', justifyContent: 'center' }}>
              <Paper elevation={4} 
                sx={{ 
                  p: 2, 
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 'auto',
                  maxWidth: '60%',
                  borderRadius: '8px',
                  border: '1px solid #ef9a9a',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="#c62828">
                  Potential Risk Flagging Dashboard
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mt: 1 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: '4px', width: '30%' }}>
                    <FlagIcon sx={{ fontSize: 20, color: '#d32f2f' }} />
                    <Typography variant="caption" display="block" fontWeight={500}>Alerts</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: '4px', width: '30%' }}>
                    <AutoFixHighIcon sx={{ fontSize: 20, color: '#d32f2f' }} />
                    <Typography variant="caption" display="block" fontWeight={500}>Actions</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: '4px', width: '30%' }}>
                    <FactCheckIcon sx={{ fontSize: 20, color: '#d32f2f' }} />
                    <Typography variant="caption" display="block" fontWeight={500}>Reports</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Discrepancy Validator Architecture */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#c62828', textAlign: 'center' }}>
            Discrepancy Validator Architecture
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 3 }}>
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <ReceiptLongIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Input Sources</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #d32f2f' }}>
                  <Typography variant="body2" fontWeight={600}>Supplier Charge Sheets</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    PO data and reasons for supplier charges
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <CategoryIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Initial Processing</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="body2" fontWeight={600}>Reason Clustering</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    LLM groups similar reasons into semantic clusters
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <SmartToyIcon sx={{ color: '#ed6c02', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Code Generation</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #ed6c02' }}>
                  <Typography variant="body2" fontWeight={600}>Validation Logic Creation</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    LLM generates specialized code for each reason bucket
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
            
            <Step active={true}>
              <StepLabel StepIconComponent={() => (
                <FactCheckIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              )}>
                <Typography variant="body1" fontWeight={600}>Analysis</Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 2, bgcolor: '#f8f8f8', ml: 2, borderLeft: '4px solid #2e7d32' }}>
                  <Typography variant="body2" fontWeight={600}>Reconciliation & Validation</Typography>
                  <Typography variant="body2" fontSize="0.875rem">
                    Data flows through validation scripts to identify recoverable charges
                  </Typography>
                </Paper>
              </StepContent>
            </Step>
          </Stepper>
          
          {/* Enhanced Visual Architecture Diagram */}
          <Box sx={{ mt: 3, p: 3, bgcolor: '#f9f9f9', borderRadius: '12px', border: '1px solid #e0e0e0', position: 'relative' }}>
            
            {/* Main data flow with detailed structure */}
            <Grid container spacing={3} alignItems="stretch" justifyContent="center">
              {/* Data Sources Section */}
              <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#ffebee', 
                  borderRadius: '8px', 
                  border: '1px solid #ffcdd2',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#b71c1c' }}>
                    Input Data
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #ffebee'
                      }}>
                        <ReceiptLongIcon sx={{ fontSize: 24, color: '#c62828', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Charge Sheets</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #ffebee'
                      }}>
                        <BusinessIcon sx={{ fontSize: 24, color: '#c62828', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Supply Chain Data</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* AI Processing Section */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#e8eaf6', 
                  borderRadius: '8px', 
                  border: '1px solid #c5cae9',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#283593' }}>
                    Validation Engine
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e8eaf6'
                      }}>
                        <AccountTreeIcon sx={{ fontSize: 24, color: '#3f51b5', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Reason Clustering</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '80px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e8eaf6'
                      }}>
                        <SmartToyIcon sx={{ fontSize: 24, color: '#3f51b5', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>LLM Analysis</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#ffffff', borderRadius: '8px', textAlign: 'center', border: '1px solid #c5cae9' }}>
                    <CodeIcon sx={{ fontSize: 20, color: '#3f51b5', verticalAlign: 'middle', mr: 0.5 }} />
                    <Typography variant="caption" display="inline" sx={{ fontWeight: 600 }}>
                      Automated Validation Scripts
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Output Section */}
              <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ 
                  p: 2, 
                  height: '100%', 
                  bgcolor: '#e8f5e9', 
                  borderRadius: '8px', 
                  border: '1px solid #c8e6c9',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <Typography variant="subtitle1" align="center" fontWeight={600} sx={{ mb: 2, color: '#2e7d32' }}>
                    Validation Results
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '90px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #e8f5e9'
                      }}>
                        <FactCheckIcon sx={{ fontSize: 24, color: '#2e7d32', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500 }}>Matched Claims</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={2} sx={{ 
                        p: 1, 
                        bgcolor: '#ffffff', 
                        textAlign: 'center', 
                        height: '90px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #f8bbd0'
                      }}>
                        <MonetizationOnIcon sx={{ fontSize: 24, color: '#d32f2f', mx: 'auto' }} />
                        <Typography variant="caption" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 500, color: '#d32f2f' }}>Recoverable Charges</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Dashboard Section */}
            <Box sx={{ mt: 5, pt: 4, display: 'flex', justifyContent: 'center' }}>
              <Paper elevation={4} 
                sx={{ 
                  p: 2, 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 'auto',
                  maxWidth: '80%',
                  borderRadius: '8px',
                  border: '1px solid #a5d6a7',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} color="#2e7d32">
                  Financial Recovery Dashboard
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={4}>
                    <Paper elevation={2} sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      borderRadius: '6px', 
                      textAlign: 'center',
                      border: '1px solid #a5d6a7'
                    }}>
                      <SavingsIcon sx={{ fontSize: 20, color: '#2e7d32', verticalAlign: 'middle', mr: 0.5 }} />
                      <Typography variant="caption" display="block" fontWeight={600}>Cost Recovery</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper elevation={2} sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      borderRadius: '6px', 
                      textAlign: 'center',
                      border: '1px solid #a5d6a7'
                    }}>
                      <AttachMoneyIcon sx={{ fontSize: 20, color: '#2e7d32', verticalAlign: 'middle', mr: 0.5 }} />
                      <Typography variant="caption" display="block" fontWeight={600}>Penalty Analysis</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper elevation={2} sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      borderRadius: '6px', 
                      textAlign: 'center',
                      border: '1px solid #a5d6a7'
                    }}>
                      <ShowChartIcon sx={{ fontSize: 20, color: '#2e7d32', verticalAlign: 'middle', mr: 0.5 }} />
                      <Typography variant="caption" display="block" fontWeight={600}>Analytics</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Metadata and Author Info */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              <strong>Author:</strong> Infyslate
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              <strong>Last Refresh:</strong> {refreshDate}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Summary;
