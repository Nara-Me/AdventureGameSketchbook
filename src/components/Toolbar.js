import React from "react";
import usePetriNet from "./PetriNet.js";

const Toolbar = () => {
  const { setMode, mode } = usePetriNet();
  
  return (
    <div className="flex gap-2 bg-gray-200 p-2 border-b tools-sidebar">
      <button className={`p-2 ${mode === "place" ? "bg-blue-400" : "bg-gray-300"}`} onClick={() => setMode("place")}>
        Place
      </button>
      <button className={`p-2 ${mode === "transition" ? "bg-blue-400" : "bg-gray-300"}`} onClick={() => setMode("transition")}>
        Action
      </button>
      <button className={`p-2 ${mode === "arc" ? "bg-blue-400" : "bg-gray-300"}`} onClick={() => setMode("arc")}>
        Arc
      </button>
    </div>
  );
};

export default Toolbar;