import React from "react";
/*import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'
import { faPause } from '@fortawesome/free-solid-svg-icons'
import { faSitemap } from '@fortawesome/free-solid-svg-icons'*/
/*import { faStop } from '@fortawesome/free-solid-svg-icons'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'
import App from "../App";*/


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

function Topbar({ mode, setMode, scenes, currentSceneId, setCurrentSceneId, onAddScene, selectedTool, setSelectedTool }) {
  //const [selectedScene, setSelectedScene] = useState(null);

  //backgrounds that can be selected
  /*const Scenes = [
    { type: "image", src: "./assets/imgs/scenes/forest_scene.jpg" },
    { type: "image", src: "./assets/imgs/scenes/mineshaftexit_scene.png" },
    { type: "image", src: "./assets/imgs/scenes/redmoon_scene.png" },
    { type: "image", src: "./assets/imgs/scenes/waterfalls_scene.jpg" },
  ];*/

  return (
    <div className="top-bar" onClick={() => setSelectedTool(selectedTool == null) }>
      <div className="name">
        <p>name <br/> logo</p>
      </div>
    {/*<div className="name">
    <FontAwesomeIcon
        icon={faSitemap}
        size="xxl"
        style={{ color: "#444746", marginRight: "8px" }}
      />
      Scenes Overview</div>*/}
    {/*<button className="play-button"
      onClick={() => setMode(mode === "edit" ? "run" : "edit")}
    >
      <FontAwesomeIcon
        icon={mode === "edit" ? faPlay : faPause}
        size="xxl"
        style={{ color: "#444746", marginRight: "8px" }}
      />
      {mode === "edit" ? "Switch to Run Mode" : "Switch to Edit Mode"}
    </button>*/}
    <div className="scenes-container">
        {scenes.map((scene) => (
          <img
            key={scene.id}
            src={scene.background}
            alt={scene.name}
            height={80}
            className={scene.id === currentSceneId ? "selected" : ""}
            onClick={() => setCurrentSceneId(scene.id)}
          />
        ))}
        <button className="add-scene-btn" onClick={onAddScene}>＋</button>
      </div>
    </div>
  );
}

export default Topbar;