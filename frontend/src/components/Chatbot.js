import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Stack,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import BuildIcon from "@mui/icons-material/Build";
import FlagIcon from "@mui/icons-material/Flag";
import { AuthContext } from "../context/AuthContext";
import { apiCall } from "../utils/api";

// Reason buckets mapping
const REASON_BUCKETS = {
  "grn missing": "GRN Issue",
  "more received": "Quantity Mismatch",
  "less received": "Quantity Mismatch",
  "asn grn mismatch": "GRN Issue",
  "currency mismatch": "Invoice Issue",
  "price mismatch": "Invoice Issue",
  "total price discrepancy": "Invoice Issue",
  "late delivery": "Late Delivery Issue",
  "invoice quantity mismatch": "Invoice Issue",
  "over delivered": "Quantity Mismatch",
  "invoice grn mismatch": "GRN Issue",
  "unit price mismatch": "Invoice Issue",
  "under delivered": "Quantity Mismatch",
  "asn/grn mismatch": "GRN Issue",
  "split shipment": "Shipping Issue",
  "invoice/grn quantity mismatch": "GRN Issue",
  "arrived late": "Late Delivery Issue",
  "missing grn": "GRN Issue",
  "multiple grns": "GRN Issue",
  "asn quantity mismatch": "Quantity Mismatch",
  "partial shipments": "Shipping Issue",
  "no reason": "Unspecified Issue",
  "under-delivery": "Quantity Mismatch",
  "over-delivery": "Quantity Mismatch",
  "no grn": "GRN Issue",
  "delivered late": "Late Delivery Issue"
};

const Chatbot = () => {
  const { token, user } = useContext(AuthContext);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [slackModalOpen, setSlackModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [slackComment, setSlackComment] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const messagesEndRef = useRef(null);

  // Helper function to map reason to its bucket
  const getReasonBucket = (reason) => {
    const lowerReason = reason.toLowerCase().trim();
    return REASON_BUCKETS[lowerReason] || reason;
  };

  // Helper to format text with markdown
  const formatTextWithMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) {
        parts.push(
          <strong key={`bold-${parts.length}`} style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
            {match[1]}
          </strong>
        );
      } else if (match[2]) {
        parts.push(
          <code
            key={`code-${parts.length}`}
            style={{
              backgroundColor: "#f3f4f6",
              color: "#7c3aed",
              padding: "3px 8px",
              borderRadius: "5px",
              fontSize: "0.9rem",
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {match[2]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Professional Claude AI-style formatter
  const formatResponseContent = (content) => {
    const paragraphs = content.split("\n\n").filter((p) => p.trim());

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {paragraphs.map((paragraph, pIdx) => {
          // Check if list with frequency pattern - more permissive regex
          // Matches: "• name: count occurrences", "- name: count", "1. name: count", "name (count occurrences)", etc.
          const frequencyPattern = /(.+?)[\s:]*\((\d+)\s*(occurrences?)?\)|(.+?):\s*(\d+)\s*(occurrences?)?/;
          const lines = paragraph.split("\n").filter((line) => {
            const trimmed = line.trim();
            // Skip empty lines and lines that are just numbers/dots (like "1.", "2.", etc.)
            return trimmed && !/^[\d+.]+$/.test(trimmed);
          });
          const frequencyLines = lines.filter((line) => frequencyPattern.test(line.trim()));

          // Debug: log if we're detecting frequency lines
          if (frequencyLines.length >= 2) {
            // Convert to table and aggregate by reason bucket
            const reasonMap = {}; // To aggregate counts by bucket
            
            frequencyLines.forEach((line) => {
              // Remove all leading numbers/dots/bullets comprehensively
              let cleanedLine = line.trim().replace(/^[\d+.•\-*\s]+/, "").trim();
              // Try matching both formats: "name: count" and "name (count occurrences)"
              let match = cleanedLine.match(/^(.+?)(\*\*)?:\s*(\d+)\s*(occurrences?)?/);
              if (!match) {
                // Try parentheses format: "name (count occurrences)"
                match = cleanedLine.match(/^(.+?)\s*\((\d+)\s*(occurrences?)?\)/);
              }
              
              if (match) {
                let rawReason = match[1].trim();
                // Remove any markdown formatting from reason name
                rawReason = rawReason.replace(/\*\*/g, "").trim();
                const count = parseInt(match[match.length - 2]); // Count is in different positions depending on format
                const bucketReason = getReasonBucket(rawReason);
                
                // Aggregate by bucket
                if (!reasonMap[bucketReason]) {
                  reasonMap[bucketReason] = { count: 0, rawReasons: [] };
                }
                reasonMap[bucketReason].count += count;
                if (!reasonMap[bucketReason].rawReasons.includes(rawReason)) {
                  reasonMap[bucketReason].rawReasons.push(rawReason);
                }
              }
            });

            // Convert map to sorted array by count (descending)
            const tableData = Object.entries(reasonMap)
              .map(([bucketName, data]) => ({
                name: bucketName,
                count: data.count,
                rawReasons: data.rawReasons
              }))
              .sort((a, b) => b.count - a.count);

            if (tableData.length >= 1) {
              const totalCount = tableData.reduce((sum, item) => sum + item.count, 0);
              
              return (
                <Box key={pIdx} sx={{ my: 1 }}>
                  <TableContainer
                    sx={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Table sx={{ minWidth: 500 }} stickyHeader>
                      <TableHead sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                        <TableRow sx={{ 
                          backgroundColor: "#f1f5fe !important", 
                          borderBottom: "2px solid #cbd5e1"
                        }}>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: "0.85rem",
                              padding: "12px 14px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              backgroundColor: "#f1f5fe !important",
                              fontFamily: "'Inter', 'Segoe UI', sans-serif",
                              borderBottom: "2px solid #cbd5e1"
                            }}
                          >
                            Reason Category
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: "0.85rem",
                              padding: "12px 14px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              backgroundColor: "#f1f5fe !important",
                              fontFamily: "'Inter', 'Segoe UI', sans-serif",
                              borderBottom: "2px solid #cbd5e1"
                            }}
                          >
                            Count
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: "0.85rem",
                              padding: "12px 14px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              width: "80px",
                              backgroundColor: "#f1f5fe !important",
                              fontFamily: "'Inter', 'Segoe UI', sans-serif",
                              borderBottom: "2px solid #cbd5e1"
                            }}
                          >
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableData.map((row, rowIdx) => (
                          <TableRow
                            key={rowIdx}
                            sx={{
                              backgroundColor: rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc",
                              borderBottom: "1px solid #e2e8f0",
                              transition: "all 0.2s ease",
                              "&:hover": { 
                                backgroundColor: "#f1f5fe",
                                boxShadow: "inset 0 0 0 1px #cbd5e1"
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                padding: "10px 14px",
                                fontSize: "0.95rem",
                                color: "#1f2937",
                                fontWeight: 600,
                                letterSpacing: "-0.005em",
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                              }}
                            >
                              {formatTextWithMarkdown(row.name)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                padding: "10px 14px",
                                fontSize: "1rem",
                                color: "#4f46e5",
                                fontWeight: 700,
                                letterSpacing: "-0.005em",
                                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                              }}
                            >
                              {row.count}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                padding: "6px 6px",
                              }}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FlagIcon sx={{ fontSize: "14px" }} />}
                                onClick={() => {
                                  setSelectedReason(row.name);
                                  setSlackModalOpen(true);
                                }}
                                sx={{
                                  borderColor: "#e2e8f0",
                                  color: "#4f46e5",
                                  fontSize: "0.8rem",
                                  padding: "6px 10px",
                                  textTransform: "none",
                                  fontWeight: 500,
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    borderColor: "#4f46e5",
                                    backgroundColor: "#f1f5fe",
                                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.15)"
                                  },
                                }}
                              >
                                Flag
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          sx={{
                            backgroundColor: "#f3f4f6",
                            borderTop: "2px solid #e5e7eb",
                          }}
                        >
                          <TableCell
                            sx={{
                              padding: "8px 10px",
                              fontSize: "0.95rem",
                              color: "#111827",
                              fontWeight: 700,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            Total
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              padding: "8px 10px",
                              fontSize: "0.95rem",
                              color: "#4f46e5",
                              fontWeight: 700,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {totalCount}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              padding: "8px 8px",
                            }}
                          />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summary */}
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: "12px",
                      backgroundColor: "#ede9fe",
                      border: "1px solid #ddd6fe",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        color: "#5b21b6",
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                        fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif"
                      }}
                    >
                      📊 Summary: {tableData.length} categories | {totalCount} total occurrences
                    </Typography>
                  </Box>
                </Box>
              );
            }
          }

          // Handle tables
          if (paragraph.includes("|") && paragraph.split("\n").length > 2) {
            const lines = paragraph.split("\n").filter((line) => line.trim());
            const headerLine = lines[0];
            const headers = headerLine.split("|").map((h) => h.trim()).filter((h) => h);

            if (lines[1] && lines[1].includes("-")) {
              const dataLines = lines.slice(2);
              const rows = dataLines
                .map((line) => line.split("|").map((cell) => cell.trim()).filter((cell) => cell))
                .filter((row) => row.length === headers.length);

              if (rows.length > 0) {
                return (
                  <Box key={pIdx} sx={{ my: 1.5, overflowX: "auto" }}>
                    <TableContainer
                      sx={{
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <Table sx={{ minWidth: 500 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            {headers.map((header, idx) => (
                              <TableCell
                                key={idx}
                                sx={{
                                  fontWeight: 700,
                                  color: "#111827",
                                  fontSize: "0.95rem",
                                  padding: "14px 16px",
                                  textTransform: "capitalize",
                                  letterSpacing: "-0.01em",
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
                                backgroundColor: rowIdx % 2 === 0 ? "#ffffff" : "#fafafa",
                                borderBottom: "1px solid #f0f0f0",
                                "&:hover": { backgroundColor: "#f9fafb" },
                              }}
                            >
                              {row.map((cell, cellIdx) => (
                                <TableCell
                                  key={cellIdx}
                                  sx={{
                                    padding: "12px 16px",
                                    fontSize: "0.95rem",
                                    color: "#111827",
                                    fontWeight: 500,
                                    letterSpacing: "-0.01em",
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

          // Handle bullet points (including * format)
          // BUT skip if these are frequency lists that should have been converted to tables
          const bulletPoints = paragraph.split("\n").filter((line) => line.trim().match(/^[-*•]\s/));
          const hasFrequencyFormat = bulletPoints.some((line) => /:\s*\d+/.test(line.trim()));
          
          if (bulletPoints.length > 0 && !hasFrequencyFormat) {
            const points = bulletPoints
              .map((line) => line.replace(/^[-*•]\s+/, "").trim())
              .filter((point) => point.length > 0);

            if (points.length > 0) {
              return (
                <Box key={pIdx} sx={{ my: 2 }}>
                  <Stack spacing={1.5}>
                    {points.map((point, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          gap: 2.5,
                          p: 1.6,
                          borderRadius: "10px",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          transition: "all 0.15s ease",
                          "&:hover": { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#4f46e5",
                            mt: 1.2,
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: "0.95rem", color: "#111827", fontWeight: 400, lineHeight: 1.9, flex: 1, letterSpacing: "-0.01em", wordBreak: "break-word", fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                          {formatTextWithMarkdown(point)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            }
          }

          // Handle numbered lists
          if (paragraph.match(/^\d+\./m)) {
            const points = paragraph
              .split("\n")
              .filter((line) => line.trim())
              .filter((line) => line.trim().match(/^\d+\./))
              .map((line) => line.replace(/^[\d+.•\-*]?\s*/, "").trim())
              .filter((line) => line.length > 0);

            if (points.length > 0) {
              return (
                <Box key={pIdx} sx={{ my: 2 }}>
                  <Stack spacing={1.5}>
                    {points.map((point, idx) => (
                      <Box key={idx} sx={{ display: "flex", gap: 2.5 }}>
                        <Typography sx={{ fontWeight: 600, color: "#4f46e5", fontSize: "1rem", minWidth: "28px", flexShrink: 0, letterSpacing: "-0.01em" }}>
                          {idx + 1}.
                        </Typography>
                        <Typography sx={{ fontSize: "0.95rem", color: "#111827", fontWeight: 400, lineHeight: 1.9, letterSpacing: "-0.01em", wordBreak: "break-word", fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                          {formatTextWithMarkdown(point)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            }
          }

          // Default paragraph with formatting
          return (
            <Typography
              key={pIdx}
              sx={{
                fontSize: "1rem",
                lineHeight: 2,
                color: "#111827",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                wordBreak: "break-word",
                fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
              }}
            >
              {formatTextWithMarkdown(paragraph)}
            </Typography>
          );
        })}
      </Box>
    );
  };

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await apiCall("/chat/new-session", { method: "POST" });
        setSessionId(response.session_id);
        setSessionLoading(false);
      } catch (err) {
        console.error("Failed to initialize chat session:", err);
        setError(`Failed to initialize: ${err.message}`);
        setSessionLoading(false);
      }
    };
    initializeSession();
  }, []);

  useEffect(() => {
    if (sessionId) loadChatHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await apiCall(`/chat-history/${sessionId}`, { method: "GET" });
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
    if (!input.trim() || !sessionId) return;

    const userMessage = input;
    setInput("");
    setLoading(true);
    setError(null);

    // Add user message immediately (optimistic update)
    const userMessageObj = { role: "user", content: userMessage, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessageObj]);

    try {
      const response = await apiCall("/chat", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, message: userMessage }),
      });

      // Add assistant message after response
      const assistantMessageObj = { role: "assistant", content: response.assistant_message, timestamp: response.timestamp };
      setMessages((prev) => [...prev, assistantMessageObj]);
    } catch (err) {
      console.error("Chat API error:", err);
      setError(err?.message || "Failed to send message");
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
      const response = await apiCall("/chat/new-session", { method: "POST" });
      setSessionId(response.session_id);
      setMessages([]);
      setError(null);
    } catch (err) {
      setError("Failed to start new chat session");
    }
  };

  // Alias for button
  const handleNewChat = handleClearChat;

  if (sessionLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#ffffff" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={50} sx={{ color: "#6366f1" }} />
          <Typography color="#6b7280">Initializing chat session...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 80px)", backgroundColor: "#f8fafc", flexDirection: "column" }}>
      {/* MAIN CONTENT */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
        {/* TOP HEADER - Modern Design */}
        <Box 
          sx={{ 
            backgroundColor: "#ffffff", 
            borderBottom: "1px solid #e2e8f0", 
            p: 3,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)"
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                }}
              >
                <SmartToyIcon sx={{ fontSize: 22, color: "white" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.15rem", letterSpacing: "-0.01em", fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif" }}>
                  Reconciliation Assistant
                </Typography>
                <Typography sx={{ fontWeight: 400, color: "#64748b", fontSize: "0.8rem", mt: 0.3, fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif" }}>
                  AI-powered analysis
                </Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              variant="outlined"
              onClick={handleNewChat}
              sx={{
                borderColor: "#e5e7eb",
                color: "#4f46e5",
                fontSize: "0.8rem",
                textTransform: "none",
                fontWeight: 500,
                padding: "8px 14px",
                "&:hover": {
                  borderColor: "#4f46e5",
                  backgroundColor: "#f3f4f6",
                }
              }}
            >
              + New Chat
            </Button>
          </Stack>
        </Box>

        {/* MESSAGES AREA */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            backgroundColor: "#f8fafc",
            background: "radial-gradient(ellipse at top, rgba(79, 70, 229, 0.08) 0%, transparent 60%)",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb:hover": { background: "#94a3b8" },
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 90,
                  height: 90,
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  mb: 4,
                  boxShadow: "0 8px 24px rgba(79, 70, 229, 0.3)"
                }}
              >
                <SmartToyIcon sx={{ fontSize: 48, color: "white" }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.8rem", mb: 1.5, letterSpacing: "-0.025em", fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                Hello {user?.username || "User"}
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "1rem", mb: 6, maxWidth: 520, mx: "auto", lineHeight: 1.7, fontWeight: 400, fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                How can I help you? Ask questions about your reconciliation data, discrepancies, and get instant AI-powered analysis.
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" gap={2}>
                <Chip 
                  label="📊 Show discrepancies" 
                  onClick={() => setInput("Show all discrepancy reasons")} 
                  variant="outlined" 
                  sx={{ 
                    borderColor: "#d1d5db", 
                    color: "#374151", 
                    backgroundColor: "#f9fafb", 
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    "&:hover": { backgroundColor: "#f3f4f6" }
                  }} 
                />
                <Chip 
                  label="📈 Frequency analysis" 
                  onClick={() => setInput("What are the discrepancy reasons with frequency?")} 
                  variant="outlined" 
                  sx={{ 
                    borderColor: "#d1d5db", 
                    color: "#374151", 
                    backgroundColor: "#f9fafb", 
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    "&:hover": { backgroundColor: "#f3f4f6" }
                  }} 
                />
                <Chip 
                  label="💰 Recovery rate" 
                  onClick={() => setInput("What is the recovery rate?")} 
                  variant="outlined" 
                  sx={{ 
                    borderColor: "#d1d5db", 
                    color: "#374151", 
                    backgroundColor: "#f9fafb", 
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    "&:hover": { backgroundColor: "#f3f4f6" }
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
                    animation: "fadeIn 0.3s ease-out",
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateY(8px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  {msg.role === "assistant" && (
                    <Box sx={{ display: "flex", gap: 2.5, maxWidth: "95%", width: "100%" }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0,
                          boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                        }}
                      >
                        <SmartToyIcon sx={{ fontSize: 18, color: "white" }} />
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "16px",
                          p: 2,
                          flex: 1,
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          maxWidth: "100%",
                          position: "relative",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Box sx={{ flex: 1, pr: 2 }}>
                            {formatResponseContent(msg.content)}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FlagIcon sx={{ fontSize: "16px" }} />}
                            onClick={() => {
                              setSelectedReason("Response");
                              setSlackModalOpen(true);
                            }}
                            sx={{
                              borderColor: "#e5e7eb",
                              color: "#4f46e5",
                              fontSize: "0.75rem",
                              padding: "6px 12px",
                              textTransform: "none",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              "&:hover": {
                                borderColor: "#4f46e5",
                                backgroundColor: "#f3f4f6",
                              },
                            }}
                          >
                            Flag
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {msg.role === "user" && (
                    <Box sx={{ display: "flex", gap: 2.5, maxWidth: "90%", width: "100%", justifyContent: "flex-end" }}>
                      <Box
                        sx={{
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #e5e7eb",
                          borderRadius: "16px",
                          p: 4,
                          flex: 1,
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <Typography sx={{ lineHeight: 1.8, wordBreak: "break-word", fontSize: "1.05rem", fontWeight: 500, color: "#0f172a", letterSpacing: "-0.01em", fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                          {msg.content}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0,
                          boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 18, color: "white" }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}

              {loading && (
                <Box sx={{ display: "flex", gap: 2.5, maxWidth: "85%" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.5,
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.8 },
                      },
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 18, color: "white" }} />
                  </Box>
                  <Box sx={{ backgroundColor: "#f9fafb", borderRadius: "14px", p: 3, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CircularProgress size={18} sx={{ color: "#4f46e5" }} />
                      <Typography sx={{ color: "#374151", fontWeight: 500, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
                        Analyzing your data...
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* ERROR */}
        {error && (
          <Box sx={{ px: 4, pt: 0 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: "10px", backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* INPUT AREA - Modern Design */}
        <Box 
          sx={{ 
            backgroundColor: "#ffffff", 
            borderTop: "1px solid #e2e8f0", 
            p: 4,
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              multiline
              rows={2}
              maxRows={5}
              placeholder="Ask about discrepancies, recovery rates, or any insights..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#4f46e5", borderWidth: "2px" },
                    boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.15)",
                  },
                },
                "& .MuiOutlinedInput-input": { 
                  fontSize: "1rem", 
                  lineHeight: 1.6, 
                  fontWeight: 500,
                  letterSpacing: "-0.012em",
                  color: "#0f172a",
                  fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif"
                },
                "& .MuiOutlinedInput-input::placeholder": { color: "#94a3b8", opacity: 1, fontWeight: 400 },
              }}
            />

            <Stack direction="row" spacing={1.5} alignItems="flex-end">
              <Button
                variant="contained"
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSendMessage}
                disabled={!input.trim() || loading || !sessionId}
                fullWidth
                sx={{
                  py: 1.3,
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  borderRadius: "12px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  letterSpacing: "-0.01em",
                  "&:hover:not(:disabled)": { 
                    boxShadow: "0 12px 32px rgba(79, 70, 229, 0.35)", 
                    transform: "translateY(-2px)" 
                  },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {loading ? "Sending..." : "Send"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Slack Modal Dialog */}
        <Dialog open={slackModalOpen} onClose={() => {
          setSlackModalOpen(false);
          setSlackComment("");
          setSelectedRecipient(null);
        }} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              fontSize: "1.15rem",
              borderBottom: "2px solid #e5e7eb",
              pb: 2
            }}
          >
            📌 Flag to {selectedRecipient ? selectedRecipient : "Team"}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {!selectedRecipient ? (
              // STEP 1: Select Recipient
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: "0.9rem", color: "#475569", fontWeight: 600, mb: 2 }}>
                    Issue: {selectedReason}
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: "#f3f4f6", 
                    borderRadius: "8px",
                    borderLeft: "4px solid #4f46e5"
                  }}>
                    <Typography sx={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500 }}>
                      {selectedReason}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "0.95rem", color: "#475569", fontWeight: 600, mb: 2 }}>
                    Send to:
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setSelectedRecipient("Finance Head")}
                      sx={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                        textTransform: "none",
                        fontSize: "0.95rem",
                        padding: "12px",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                        "&:hover": { 
                          backgroundColor: "#3f3acc",
                          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                        },
                      }}
                    >
                      💰 Finance Head
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setSelectedRecipient("Logistics Head")}
                      sx={{
                        backgroundColor: "#059669",
                        color: "white",
                        textTransform: "none",
                        fontSize: "0.95rem",
                        padding: "12px",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                        "&:hover": { 
                          backgroundColor: "#047857",
                          boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                        },
                      }}
                    >
                      📦 Logistics Head
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setSelectedRecipient("Deployment Head")}
                      sx={{
                        backgroundColor: "#7c3aed",
                        color: "white",
                        textTransform: "none",
                        fontSize: "0.95rem",
                        padding: "12px",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                        "&:hover": { 
                          backgroundColor: "#6d28d9",
                          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
                        },
                      }}
                    >
                      🚀 Deployment Head
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            ) : (
              // STEP 2: Add Comments
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, mb: 1 }}>
                    Recipient
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: "#f0f9ff", 
                    borderRadius: "8px",
                    border: "1px solid #bae6fd"
                  }}>
                    <Typography sx={{ fontSize: "0.95rem", color: "#0c4a6e", fontWeight: 600 }}>
                      {selectedRecipient}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, mb: 1 }}>
                    Issue Category
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: "#f3f4f6", 
                    borderRadius: "8px",
                    borderLeft: "4px solid #4f46e5"
                  }}>
                    <Typography sx={{ fontSize: "0.95rem", color: "#111827", fontWeight: 500 }}>
                      {selectedReason}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: "0.9rem", color: "#475569", fontWeight: 600, mb: 1.5 }}>
                    Add Comments (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add any additional context, notes, or comments..."
                    value={slackComment}
                    onChange={(e) => setSlackComment(e.target.value)}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        backgroundColor: "#f9fafb",
                        border: "1.5px solid #e2e8f0",
                        transition: "all 0.3s ease",
                        "&:hover": { borderColor: "#cbd5e1" },
                        "&.Mui-focused": {
                          borderColor: "#4f46e5",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.1)",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        fontSize: "0.95rem",
                        fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
                        color: "#1f2937",
                      },
                      "& .MuiOutlinedInput-input::placeholder": {
                        color: "#94a3b8",
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ backgroundColor: "#f0fdf4", p: 2, borderRadius: "10px", border: "1px solid #dcfce7" }}>
                  <Typography sx={{ fontSize: "0.9rem", color: "#166534", fontWeight: 500 }}>
                    ✓ This will notify {selectedRecipient} via Slack with your issue and comments.
                  </Typography>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e5e7eb", gap: 1 }}>
            {selectedRecipient && (
              <Button
                onClick={() => {
                  setSelectedRecipient(null);
                  setSlackComment("");
                }}
                sx={{
                  color: "#64748b",
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#f1f5fe" }
                }}
              >
                Back
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={() => {
                setSlackModalOpen(false);
                setSlackComment("");
                setSelectedRecipient(null);
              }}
              sx={{
                color: "#64748b",
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                "&:hover": { backgroundColor: "#f1f5fe" }
              }}
            >
              Cancel
            </Button>
            {selectedRecipient && (
              <Button
                variant="contained"
                onClick={() => {
                  console.log(`Slack to ${selectedRecipient} - Issue: ${selectedReason}, Comments: ${slackComment}`);
                  alert(`✓ Notification sent to ${selectedRecipient}!\n\nIssue: ${selectedReason}\n${slackComment ? `Comments: ${slackComment}` : ""}`);
                  setSlackModalOpen(false);
                  setSlackComment("");
                  setSelectedRecipient(null);
                }}
                sx={{
                  backgroundColor: "#4f46e5",
                  color: "white",
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  "&:hover": { backgroundColor: "#3f3acc" },
                }}
              >
                Send
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Chatbot;
