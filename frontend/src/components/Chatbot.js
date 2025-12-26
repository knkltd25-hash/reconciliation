import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Stack,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import { AuthContext } from "../context/AuthContext";
import { apiCall } from "../utils/api";

const Chatbot = () => {
  const { token } = useContext(AuthContext);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Function to parse and format response content
  const formatResponseContent = (content) => {
    // Split content into paragraphs for better structure
    const paragraphs = content.split("\n\n").filter((p) => p.trim());

    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        {paragraphs.map((paragraph, pIdx) => {
          // Check if paragraph contains a table (pipe-delimited format)
          if (paragraph.includes("|") && paragraph.split("\n").length > 2) {
            const lines = paragraph.split("\n").filter((line) => line.trim());
            const headerLine = lines[0];
            const headers = headerLine.split("|").map((h) => h.trim()).filter((h) => h);

            // Check if it's a markdown table
            if (lines[1] && lines[1].includes("-")) {
              const dataLines = lines.slice(2);
              const rows = dataLines
                .map((line) => line.split("|").map((cell) => cell.trim()).filter((cell) => cell))
                .filter((row) => row.length === headers.length);

              if (rows.length > 0) {
                return (
                  <Box key={pIdx} sx={{ mt: 3, mb: 3 }}>
                    <TableContainer
                      sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 4px 16px rgba(37, 99, 235, 0.12)",
                        border: "1px solid rgba(37, 99, 235, 0.15)",
                      }}
                    >
                      <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                          <TableRow
                            sx={{
                              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)",
                              borderBottom: "2px solid rgba(37, 99, 235, 0.25)",
                            }}
                          >
                            {headers.map((header, idx) => (
                              <TableCell
                                key={idx}
                                sx={{
                                  fontWeight: 700,
                                  color: "#2563eb",
                                  fontSize: "0.95rem",
                                  padding: "16px 12px",
                                  textTransform: "capitalize",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row, rowIdx) => (
                            <TableRow
                              key={rowIdx}
                              sx={{
                                backgroundColor: rowIdx % 2 === 0 ? "#ffffff" : "rgba(37, 99, 235, 0.03)",
                                borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                                  boxShadow: "inset 0 0 8px rgba(37, 99, 235, 0.08)",
                                },
                              }}
                            >
                              {row.map((cell, cellIdx) => (
                                <TableCell
                                  key={cellIdx}
                                  sx={{
                                    padding: "14px 12px",
                                    fontSize: "0.9rem",
                                    color: "#334155",
                                    fontWeight: 500,
                                    borderRight: cellIdx < row.length - 1 ? "1px solid rgba(226, 232, 240, 0.4)" : "none",
                                  }}
                                >
                                  {isNaN(cell) ? cell : parseFloat(cell).toLocaleString()}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              }
            }
          }

          // Handle bullet points
          if (paragraph.includes("•") || paragraph.match(/^\s*[-•]\s/m)) {
            const points = paragraph
              .split("\n")
              .filter((line) => line.trim().startsWith("•") || line.trim().match(/^[-]\s/))
              .map((line) => line.replace(/^[•-]\s*/, "").trim());

            if (points.length > 0) {
              return (
                <Box key={pIdx} sx={{ mt: 2, mb: 2 }}>
                  <Stack spacing={1.5}>
                    {points.map((point, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          gap: 2,
                          p: 1.5,
                          borderLeft: "4px solid #2563eb",
                          backgroundColor: "rgba(37, 99, 235, 0.04)",
                          borderRadius: "6px",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            borderLeftColor: "#3b82f6",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                            mt: 1,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.9rem",
                            color: "#334155",
                            fontWeight: 500,
                            lineHeight: 1.6,
                          }}
                        >
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            }
          }

          // Default: return as formatted paragraph
          return (
            <Typography
              key={pIdx}
              sx={{
                fontSize: "0.95rem",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#334155",
                fontWeight: 400,
                mb: 2,
              }}
            >
              {paragraph}
            </Typography>
          );
        })}
      </Box>
    );
  };

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("Initializing chat session...");
        const response = await apiCall("/chat/new-session", {
          method: "POST",
        });
        console.log("Session created:", response);
        setSessionId(response.session_id);
        setSessionLoading(false);
      } catch (err) {
        console.error("Failed to initialize chat session:", err);
        setError(`Failed to initialize chat session: ${err.message}`);
        setSessionLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Load chat history when session is ready
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await apiCall(`/chat-history/${sessionId}`, {
        method: "GET",
      });
      const formattedMessages = [];
      response.messages.forEach((msg) => {
        formattedMessages.push({
          role: "user",
          content: msg.user_message,
          timestamp: msg.timestamp,
        });
        formattedMessages.push({
          role: "assistant",
          content: msg.assistant_message,
          timestamp: msg.timestamp,
        });
      });
      setMessages(formattedMessages);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) {
      console.warn("Cannot send: input empty or no session");
      return;
    }

    const userMessage = input;
    setInput("");
    setLoading(true);
    setError(null);

    try {
      console.log("Sending message to /chat endpoint:", { userMessage, sessionId });
      
      const response = await apiCall("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      console.log("Received response from /chat:", response);

      // Add messages to state
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
        {
          role: "assistant",
          content: response.assistant_message,
          timestamp: response.timestamp,
        },
      ]);
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMessage = err?.message || "Failed to send message. Please try again.";
      setError(errorMessage);
      // Add user message even if there was an error
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await apiCall("/chat/new-session", {
        method: "POST",
      });
      setSessionId(response.session_id);
      setMessages([]);
      setError(null);
    } catch (err) {
      setError("Failed to start new chat session");
    }
  };

  if (sessionLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography color="textSecondary">Initializing chat session...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f0f9fb",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
          color: "white",
          p: 3.5,
          boxShadow: "0 20px 50px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <SmartToyIcon sx={{ fontSize: 28, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.2)", lineHeight: 1.1 }}>
                Ask Me
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                Intelligence Hub
              </Typography>
            </Box>
          </Stack>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleClearChat}
            sx={{
              backgroundColor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.3)",
              px: 2.5,
              py: 1.25,
              borderRadius: "10px",
              "&:hover": { 
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.5)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              },
              textTransform: "none",
              fontWeight: 700,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              letterSpacing: "0.4px",
              fontSize: "0.9rem",
            }}
          >
            New Chat
          </Button>
        </Stack>
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 3.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          "&::-webkit-scrollbar": {
            width: "10px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)",
            borderRadius: "8px",
            border: "3px solid transparent",
            backgroundClip: "padding-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
            backgroundClip: "padding-box",
          },
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, px: 2 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 100,
                height: 100,
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                mb: 3,
                mx: "auto",
              }}
            >
              <SmartToyIcon sx={{ fontSize: 56, color: "#2563eb", filter: "drop-shadow(0 4px 8px rgba(37, 99, 235, 0.2))" }} />
            </Box>
            <Typography variant="h6" color="#1e293b" sx={{ mb: 1.5, fontWeight: 800, letterSpacing: "-0.01em", fontSize: "1.25rem" }}>
              Welcome to Ask Me
            </Typography>
            <Typography variant="body2" color="#718096" sx={{ mb: 5, maxWidth: 480, lineHeight: 1.7, fontWeight: 500, fontSize: "0.95rem" }}>
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={2}>
              <Chip
                label="📊 Show discrepancies"
                onClick={() => setInput("Show all discrepancy reasons")}
                variant="outlined"
                sx={{
                  borderColor: "#2563eb",
                  color: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.06)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  py: 3,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    borderColor: "#2563eb",
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
              />
              <Chip
                label="📈 Frequency analysis"
                onClick={() => setInput("What are the discrepancy reasons with frequency?")}
                variant="outlined"
                sx={{
                  borderColor: "#2563eb",
                  color: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.06)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  py: 3,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    borderColor: "#2563eb",
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
              />
              <Chip
                label="💰 Recovery rate"
                onClick={() => setInput("What is the recovery rate?")}
                variant="outlined"
                sx={{
                  borderColor: "#2563eb",
                  color: "#2563eb",
                  backgroundColor: "rgba(37, 99, 235, 0.06)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  py: 3,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    borderColor: "#2563eb",
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                }}
              />
            </Stack>
          </Box>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  animation: "fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  "@keyframes fadeIn": {
                    from: { opacity: 0, transform: "translateY(12px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{ maxWidth: "80%", width: "100%" }}
                >
                  {msg.role === "assistant" && (
                    <SmartToyIcon
                      sx={{
                        fontSize: 28,
                        color: "#2563eb",
                        flexShrink: 0,
                        filter: "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15))",
                        mt: 1,
                      }}
                    />
                  )}
                  <Card
                    sx={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                          : "#ffffff",
                      color: msg.role === "user" ? "white" : "#1e293b",
                      boxShadow:
                        msg.role === "user"
                          ? "0 8px 28px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                      borderRadius: "16px",
                      borderTopLeftRadius: msg.role === "user" ? 16 : 6,
                      borderTopRightRadius: msg.role === "user" ? 6 : 16,
                      flex: 1,
                      border: msg.role === "user" ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
                      backdropFilter: msg.role === "user" ? "none" : "blur(10px)",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                      {/* Header */}
                      <Box
                        sx={{
                          px: 2.5,
                          pt: 2,
                          pb: 1.5,
                          background: msg.role === "user" 
                            ? "rgba(0,0,0,0.1)"
                            : "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)",
                          borderBottom: msg.role === "user" 
                            ? "1px solid rgba(255,255,255,0.15)"
                            : "1px solid rgba(226, 232, 240, 0.6)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            color: msg.role === "user" ? "rgba(255,255,255,0.8)" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {msg.role === "user" ? (
                            <>
                              <PersonIcon sx={{ fontSize: 14 }} /> Your Question
                            </>
                          ) : (
                            <>
                              <SmartToyIcon sx={{ fontSize: 14 }} /> Analysis
                            </>
                          )}
                        </Typography>
                      </Box>

                      {/* Content */}
                      <Box sx={{ px: 2.5, py: 2.5 }}>
                        {msg.role === "assistant" ? (
                          formatResponseContent(msg.content)
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.85,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              letterSpacing: "0.35px",
                              fontWeight: 600,
                              fontSize: "0.96rem",
                              fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
                              color: "#ffffff",
                              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
                            {msg.content}
                          </Typography>
                        )}
                      </Box>

                      {/* Footer - Timestamp */}
                      <Box
                        sx={{
                          px: 2.5,
                          pb: 1.5,
                          pt: 1,
                          borderTop: msg.role === "user"
                            ? "1px solid rgba(255,255,255,0.1)"
                            : "1px solid rgba(226, 232, 240, 0.4)",
                          textAlign: "right",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: msg.role === "user" ? 0.7 : 0.65,
                            fontSize: "11px",
                            fontWeight: 500,
                            letterSpacing: "0.2px",
                            color: msg.role === "user" ? "inherit" : "#718096",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  {msg.role === "user" && (
                    <PersonIcon
                      sx={{
                        fontSize: 28,
                        color: "#2563eb",
                        flexShrink: 0,
                        filter: "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15))",
                        mt: 1,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            ))}
            {loading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 1.5,
                  animation: "fadeIn 0.4s ease-in",
                }}
              >
                <SmartToyIcon
                  sx={{
                    fontSize: 28,
                    color: "#2563eb",
                    filter: "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15))",
                  }}
                />
                <Card
                  sx={{
                    backgroundColor: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                    borderRadius: "16px",
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 16,
                    p: 2.5,
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={20} sx={{ color: "#2563eb" }} />
                    <Typography variant="body2" color="#64748b" sx={{ fontWeight: 600, letterSpacing: "0.3px", fontSize: "0.9rem" }}>
                      Analyzing your data...
                    </Typography>
                  </Stack>
                </Card>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ px: 3, pt: 0 }}>
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#ffebee",
              color: "#c62828",
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Input Area */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderTop: "2px solid #e2e8f0",
          p: 3.5,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            multiline
            rows={2}
            maxRows={5}
            placeholder="Ask me about discrepancies, recovery rates, or any reconciliation insights..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#f8f9fb",
                border: "1.5px solid #e2e8f0",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "#f0f2f8",
                  borderColor: "#cbd5e0",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#2563eb",
                    borderWidth: "2px",
                  },
                  boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.12)",
                },
              },
              "& .MuiOutlinedInput-input": {
                fontSize: "0.95rem",
                lineHeight: 1.6,
                fontWeight: 500,
              },
              "& .MuiOutlinedInput-input::placeholder": {
                color: "#a0aec0",
                opacity: 1,
                fontWeight: 500,
              },
            }}
          />
          <Button
            variant="contained"
            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSendMessage}
            disabled={!input.trim() || loading || !sessionId}
            fullWidth
            sx={{
              py: 1.75,
              background: loading ? "#3b82f6" : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              boxShadow: "0 8px 28px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.4px",
              borderRadius: "12px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover:not(:disabled)": {
                boxShadow: "0 12px 40px rgba(37, 99, 235, 0.4)",
                transform: "translateY(-3px)",
              },
              "&:active:not(:disabled)": {
                transform: "translateY(-1px)",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
              },
              "&:disabled": {
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transform: "none",
                opacity: 0.6,
              },
            }}
          >
            {loading ? "Thinking..." : "Send Message"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Chatbot;
