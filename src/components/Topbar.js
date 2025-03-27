import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { faPause } from '@fortawesome/free-solid-svg-icons'
import { faStop } from '@fortawesome/free-solid-svg-icons'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import App from "../App";


//https://fontawesome.com/icons/stop?f=classic&s=solid

/*const Topbar = () => {
  const { setMode , mode } = App();

  return (
    <div className="top-bar">
      <div className="name">Name of the project</div>
      <div className="play-button">
        <FontAwesomeIcon icon={faPlay} size="xxl" style={{color: "#444746",}} />
        Play Mode</div>
      <div className="edit-button">
        <FontAwesomeIcon icon={faPause} size="xxl" style={{color: "#444746",}} />
        Edit Mode</div>
    </div>
  );
};*/

function Topbar({ mode, setMode }) {
  return (
    <div className="top-bar">
    {/*<button onClick={() => setMode(mode === "edit" ? "run" : "edit")}>
      {mode === "edit" ? "Switch to Run Mode" : "Switch to Edit Mode"}
    </button>*/}
    <div className="name">Name of the project</div>
    <button className="play-button"
      onClick={() => setMode(mode === "edit" ? "run" : "edit")}
    >
      <FontAwesomeIcon
        icon={mode === "edit" ? faPlay : faPause}
        size="xxl"
        style={{ color: "#444746", marginRight: "8px" }}
      />
      {mode === "edit" ? "Switch to Run Mode" : "Switch to Edit Mode"}
    </button>
    </div>
  );
}

export default Topbar;