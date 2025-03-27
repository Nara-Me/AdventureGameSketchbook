import React from "react";
import usePetriNet from "./PetriNet.js";

/*const Toolbar = () => {
  const { setMode, mode } = usePetriNet();
  
  return (
    <div className="tools-sidebar">
      <button className={`${mode === "place" ? "bg-blue" : "bg-gray"}`} onClick={() => setMode("place")}>
        Place
      </button>
      <button className={`${mode === "transition" ? "bg-blue" : "bg-gray"}`} onClick={() => setMode("transition")}>
        Action
      </button>
      <button className={`${mode === "arc" ? "bg-blue" : "bg-gray"}`} onClick={() => setMode("arc")}>
        Arc
      </button>
    </div>
  );
};*/

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