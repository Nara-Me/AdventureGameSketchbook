import React from "react";
import usePetriNet from "./PetriNet.js";

const Toolbar = () => {
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
};

export default Toolbar;