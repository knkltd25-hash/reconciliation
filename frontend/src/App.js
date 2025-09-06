import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Tagging from "./components/Tagging";
import Validation from "./components/Validation";
import Summary from "./components/Summary";
import { Box } from "@mui/material";

function App() {
  const [selected, setSelected] = useState("summary");
  const [workflowRun, setWorkflowRun] = useState(false);

  const handleSidebarSelect = (option) => {
    setSelected(option);
  };

  const handleWorkflowRun = () => {
    setWorkflowRun(true);
    setTimeout(() => setWorkflowRun(false), 2000); // Simulate workflow
  };

  // Example usage of BACKEND_URL (remove this in production)
  // console.log("Backend URL:", BACKEND_URL);
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar selected={selected} onSelect={handleSidebarSelect} />
      <Box sx={{ flex: 1, p: 3, background: "#f7f8fa", overflowY: 'auto' }}>
        {selected === "summary" && <Summary />}
        {selected === "tagging" && <Tagging />}
        {selected === "validation" && <Validation />}
      </Box>
    </Box>
  );
}

export default App;
