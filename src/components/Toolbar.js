import React from "react";

function Toolbar({ selectedTool, setSelectedTool }) {
  return (
    <div className="tools-sidebar">
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        {/* Place Tool */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: selectedTool === "place" ? "lightblue" : "white",
            border: "2px solid black",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTool(selectedTool === "place" ? null : "place")}
        ></div>

        {/* Arc Tool */}
        <div
          style={{
            width: 40,
            height: 20,
            background: selectedTool === "arc" ? "lightblue" : "white",
            border: "2px solid black",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTool(selectedTool === "arc" ? null : "arc")}
        ></div>

        {/* Transition Tool */}
        <div
          style={{
            width: 80,
            height: 40,
            borderRadius: "10%",
            background: selectedTool === "transition" ? "lightblue" : "white",
            border: "2px solid black",
            cursor: "pointer",
          }}
          onClick={() => setSelectedTool(selectedTool === "transition" ? null : "transition")}
        ></div>
      </div>
    </div>
  );
}

export default Toolbar;