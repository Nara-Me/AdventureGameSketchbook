import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Image, Group } from "react-konva";
import useImage from "use-image";

import Topbar from "./components/Topbar.js";
import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";

import LoadImage from "./components/LoadImage";

const WORKSPACE_SIZE = 5000;

const GAP_SIZE = 7; //7
const BORDER_SIZE = 2;
const PLACE_RADIUS = 20; //20
const TRANSITION_WIDTH = 100;
const TRANSITION_HEIGHT = 40;
const debug = false; // true to show edit mode when "running"

const App = () => {
  const width= window.innerWidth;
  const height= window.innerHeight;

  // workplace const
  const [workspaceScale, setWorkspaceScale] = useState(1);
  const [workspacePosition, setWorkspacePosition] = useState({ x: 0, y: 0 });
  //const [isElementDragging, setIsElementDragging] = useState(false);
  const workspaceRef = useRef(null);
  const stageRef = useRef(null);

  const handleWheel = (e) => { //demo taken (and adapted) from konva
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = workspaceScale;
    const pointer = stageRef.current.getPointerPosition();

    // Convert pointer to workspace coordinates
    const group = workspaceRef.current;
    const groupPos = group.getAbsolutePosition();
    const mousePointTo = {
      x: (pointer.x - groupPos.x) / oldScale,
      y: (pointer.y - groupPos.y) / oldScale,
    };

    // Calculate new scale
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.1, Math.min(3, newScale));

    // Calculate new position to keep pointer under mouse
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setWorkspaceScale(newScale);
    setWorkspacePosition(newPos);
  };

  // elements (places, transitions, arcs) const
  const [selectedElement, setSelectedElement] = useState(null);
  const [mode, setMode] = useState("edit"); // Modes: "edit", "run", and maybe "overview"
  const [selectedTool, setSelectedTool] = useState(null); // none, places, transitions, arrows
  const [contextMenu, setContextMenu] = useState(null); // delete and TBA
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [nextPlaceId, setNextPlaceId] = useState(1);
  const [nextTransitionId, setNextTransitionId] = useState(1);

  // asset library const
  const [userImages, setUserImages] = useState([]); //images from user in asset library
  const [userAudios, setUserAudios] = useState([]); //audios from user in asset library
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);

  const [character, setCharacter] = useState({ x: 100, y: 600, size: 80 }); // controlable character in run mode

  // scenes const
  const [scenes, setScenes] = useState([ //array of preloaded scenes for testing
    {
      id: 1,
      name: "Forest Scene",
      background: "./assets/imgs/scenes/forest_scene.jpg",
      places: [],
      transitions: [],
      arcs: [],
    },
    {
      id: 2,
      name: "Mineshaft Exit",
      background: "./assets/imgs/scenes/mineshaftexit_scene.png",
      places: [],
      transitions: [],
      arcs: [],
    },
    {
      id: 3,
      name: "Red Moon",
      background: "./assets/imgs/scenes/redmoon_scene.png",
      places: [],
      transitions: [],
      arcs: [],
    },
    {
      id: 4,
      name: "Waterfalls",
      background: "./assets/imgs/scenes/waterfalls_scene.jpg",
      places: [],
      transitions: [],
      arcs: [],
    },
    {
      id: 5,
      name: "Grasslands",
      background: "./assets/imgs/scenes/grasslands_scene.png",
      places: [],
      transitions: [],
      arcs: [],
    },
  ]);
  const [currentSceneId, setCurrentSceneId] = useState(1); //default to the first scene
  const currentScene = scenes.find((scene) => scene.id === currentSceneId);

  const handleAddScene = () => { //NEEDS TO BE REVAMPED
    const url = window.prompt("Enter image URL for new scene:");
    if (url) {
      setScenes(prev => [
        ...prev,
        {
          id: prev.length + 1,
          name: `Scene ${prev.length + 1}`,
          background: url,
          places: [],
          transitions: [],
          arcs: [],
        }
      ]);
    }
  };

  useEffect(() => { //flip modes with esc key
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMode((prev) => (prev === "edit" ? "run" : "edit"));
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleImageUpload = (e) => { //allows for image upload from users
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImages(prev => [...prev, { src: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAudioUpload = (e) => { //allows for audio upload from users
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserAudios(prev => [...prev, { src: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const isOverlapping = (x, y) => { //when placing an element, check if there is one already
    return (
      currentScene.places.some((p) => Math.hypot(p.x - x, p.y - y) < PLACE_RADIUS+10) ||
      currentScene.transitions.some((t) => Math.abs(t.x - x) < TRANSITION_WIDTH / 2 && Math.abs(t.y - y) < TRANSITION_HEIGHT / 2)
    );
  };

  const calculateArrowPoints = (from, to) => { //calculate the beginning and end points of the arrow
    const fromElement = currentScene.places.find((p) => p.id === from.id) || currentScene.transitions.find((t) => t.id === from.id);
    const toElement = currentScene.places.find((p) => p.id === to.id) || currentScene.transitions.find((t) => t.id === to.id);
    if (!fromElement || !toElement) return [];

    let { x: x1, y: y1 } = fromElement;
    let { x: x2, y: y2 } = toElement;

    const angle = Math.atan2((y2 - y1), (x2 - x1));
    if (from.type === "place") { //radius for places
      x1 += (GAP_SIZE + PLACE_RADIUS) * Math.cos(angle);
      y1 += (GAP_SIZE + PLACE_RADIUS) * Math.sin(angle);
    } else if (from.type === "transition") { //middle point for transitions
      x1 += (GAP_SIZE + TRANSITION_WIDTH/2) * Math.cos(angle);
      y1 += (GAP_SIZE + TRANSITION_HEIGHT/2) * Math.sin(angle);
    }

    if (to.type === "place") {
      x2 -= (GAP_SIZE + PLACE_RADIUS) * Math.cos(angle);
      y2 -= (GAP_SIZE + PLACE_RADIUS) * Math.sin(angle);
    } else if (to.type === "transition") {
      x2 -= (GAP_SIZE + TRANSITION_WIDTH/2) * Math.cos(angle);
      y2 -= (GAP_SIZE + TRANSITION_HEIGHT/2) * Math.sin(angle);
    }

    return [x1, y1, x2, y2];
  };

  const handleStageClick = (e) => { //handle clicking on the canvas
    
    if (e.target === e.target.getStage()) { //clicked the canvas but not an element
      setConnectingFrom(null); //cancell connection if there is one
      //console.log("connection cancelled");
      setSelectedElement(null); //deselect element
      setContextMenu(null); //close the delete menu
    }
    if (e.evt.button !== 0 || mode !== "edit") return; //return if not in edit mode
    
    // Convert pointer position to workspace coordinates
    const pointer = stageRef.current.getPointerPosition();
    const group = workspaceRef.current;
    const groupPos = group.getAbsolutePosition();
    const x = (pointer.x - groupPos.x) / workspaceScale;
    const y = (pointer.y - groupPos.y) / workspaceScale;

    //const { x, y } = e.target.getStage().getPointerPosition();
    if (isOverlapping(x, y)) {
      // do nothing if overlapping
      //console.log("overlapping with another");
      return;}

    if (selectedTool === "place") {
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              places: [...scene.places, { id: `p${nextPlaceId}`, x, y, tokens: 0 }],
            }
          : scene
      );
      setScenes(updatedScenes);
      setNextPlaceId(nextPlaceId + 1);
    } else if (selectedTool === "transition") {
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              transitions: [...scene.transitions, { id: `t${nextTransitionId}`, x, y }],
            }
          : scene
      );
      setScenes(updatedScenes);
      setNextTransitionId(nextTransitionId + 1);
    }
  };

  const handleElementClick = (id, type) => {
    if (mode === "run" && type === "transition") {
      fireTransition(id);
      return;
    }

    if (mode === "edit") {

      let element;
      if (type === "place") {
        element = currentScene.places.find((p) => p.id === id);
        setSelectedElement({
          id,
          type,
          asset: element?.asset || null,
          //add more place properties later
        });
      } else {
        element = currentScene.transitions.find((t) => t.id === id);
        setSelectedElement({
          id,
          type,
          asset: element?.asset || null,
          allowPartialFiring: element?.allowPartialFiring ?? false,
          //add more transition properties later
        });
      }

      if (selectedTool !== "arc") { //cancel connection if not arc tool
        setConnectingFrom(null);
        return;
      }
  
      if (!connectingFrom) { //start connecting elements with arcs
        setConnectingFrom({ id, type });
        //console.log("connecting");
      } else if (connectingFrom.id !== id && connectingFrom.type !== type) {
        //console.log("connected");
        const updatedScenes = scenes.map((scene) =>
          scene.id === currentSceneId
            ? {
                ...scene,
                arcs: [...scene.arcs, { from: connectingFrom, to: { id, type } }],
              }
            : scene
        );
        setScenes(updatedScenes);
        setConnectingFrom(null);
      } else if (connectingFrom.id === id || connectingFrom.type === type) {
        setConnectingFrom(null);
        setConnectingFrom({ id, type });
        //console.log("connection restarted");
        return;
      } else {
        //console.log("connection cancelled");
        setConnectingFrom(null);
      }
    }
  };

  const handleDragMove = (e, id, type) => { //handle dragging of the elements
    //setStagePosition(e.target.position());
    const group = workspaceRef.current;
    const groupPos = group.getAbsolutePosition();
    const { x, y } = e.target.position();

    const updatedScenes = scenes.map((scene) =>
    scene.id === currentSceneId
      ? {
          ...scene,
          [type === "place" ? "places" : "transitions"]: scene[
            type === "place" ? "places" : "transitions"
          ].map((el) => (el.id === id ? { ...el, x, y } : el)),
        }
      : scene
  );

  setScenes(updatedScenes);
  };

  const handleContextMenu = (e, id, type) => { //right click on an element
    setConnectingFrom(null);
    e.evt.preventDefault();
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, id, type });
  };

  const deleteElement = () => { //delete the selected element
    setConnectingFrom(null);
    if (!contextMenu) return;
    const { id, type } = contextMenu; //may be deprecated

    const updatedScenes = scenes.map((scene) => { //simplified version
      if (scene.id === currentSceneId) {
        const updatedScene = { ...scene };
        if (type === "arc") { // only delete the arc connecting two elements
          updatedScene.arcs = updatedScene.arcs.filter((_, index) => index !== id)
          return updatedScene;
        }
        updatedScene.arcs = updatedScene.arcs.filter((arc) => arc.from.id !== id && arc.to.id !== id); // delete the arc connected to the deleted element
        if (type === "place") {
          updatedScene.places = updatedScene.places.filter((p) => p.id !== id);
        }
        if (type === "transition") {
          updatedScene.transitions = updatedScene.transitions.filter((t) => t.id !== id);
        }
        return updatedScene;
      }
      return scene;
    });

    /*const updatedScenes = scenes.map((scene) =>
      scene.id === currentSceneId
        ? {
            ...scene,
            arcs: scene.arcs.filter((arc) => arc.from.id !== id && arc.to.id !== id),
            places: type === "place" ? scene.places.filter((p) => p.id !== id) : scene.places,
            transitions: type === "transition" ? scene.transitions.filter((t) => t.id !== id) : scene.transitions,
          }
        : scene
    );*/
    setScenes(updatedScenes);
    setContextMenu(null);
  };

  const AssetRenderer = ({ x, y, asset }) => { //render the images in the canvas
    const [image] = useImage(asset?.image?.src || null);
  
    if (!image) return null;
  
    const aspectRatio = image.naturalWidth / image.naturalHeight;
  
    const desiredWidth = 50;
    const desiredHeight = desiredWidth / aspectRatio;
  
    return (
      <Image
        x={x - desiredWidth / 2} // Center the image horizontally
        y={y + desiredHeight - 10} // Position the image
        image={image}
        width={desiredWidth}
        height={desiredHeight}
      />
    );
  };

  const updateElementAsset = (id, type, asset, allowPartialFiring) => {
    //updates the scene's array
    const updatedScenes = scenes.map((scene) => { //loops through all the scenes and only updates the current one
      if (scene.id === currentSceneId) {
        const typeUpdate = type === "place" ? "places" : "transitions"; //updates either places or transitions
        return {
          ...scene,
          [typeUpdate]: scene[typeUpdate].map((element) => //loops through all places or transitions in the scene
            element.id === id
              ? {
                  ...element,
                  asset: { ...asset },
                  ...(typeof allowPartialFiring !== "undefined"
                    ? { allowPartialFiring }
                    : {}),
                }
              : element
          ),
        };
      }
      return scene;
    });
    setScenes(updatedScenes);

    //updates the selected elements state
    if (selectedElement?.id === id && selectedElement?.type === type) {
      setSelectedElement((prev) => ({
        ...prev,
        asset: { ...asset },
        ...(typeof allowPartialFiring !== "undefined"
          ? { allowPartialFiring }
          : {}),
          /*allowPartialFiring:
            typeof allowPartialFiring !== "undefined"
              ? allowPartialFiring
              : prev.allowPartialFiring,*/
      }));
    }
  };

  const fireTransition = (transitionId) => {
    const transition = currentScene.transitions.find((t) => t.id === transitionId);
    if (!transition) return; //check if transition even exists
  
    const inputPlaces = currentScene.arcs.filter((arc) => arc.to.id === transitionId).map((arc) => arc.from.id);
    const outputPlaces = currentScene.arcs.filter((arc) => arc.from.id === transitionId).map((arc) => arc.to.id);
  
    // Check if all input places have at least one token
    const allInputsHaveTokens = inputPlaces.every((id) => (currentScene.places.find((p) => p.id === id)?.tokens || 0) >= 1);
    //console.log(allInputsHaveTokens);
  
    // If partialFiring is false (default), require all inputs to have tokens
    if (!transition.allowPartialFiring && !allInputsHaveTokens) return;
  
    // If partialFiring is true, check if at least one input has tokens
    if (transition.allowPartialFiring && inputPlaces.every((id) => (currentScene.places.find((p) => p.id === id)?.tokens || 0) < 1)) return;
  
    // Fire the transition
    const updatedScenes = scenes.map((scene) =>
    scene.id === currentSceneId
      ? {
          ...scene,
          places: scene.places.map((p) => {
            if (inputPlaces.includes(p.id)) {
              const newTokens = p.tokens - 1;
              return { ...p, tokens: Math.max(newTokens, 0) }; // Prevent tokens from going negative
            } else if (outputPlaces.includes(p.id)) {
              return { ...p, tokens: p.tokens + 1 };
            }
            return p;
          }),
        }
      : scene
  );

  setScenes(updatedScenes);
    /*setPlaces((prev) =>
      prev.map((p) => {
        if (inputPlaces.includes(p.id)) {
          const newTokens = p.tokens - 1;
          return { ...p, tokens: Math.max(newTokens, 0) }; // Prevent tokens from going negative
        } else if (outputPlaces.includes(p.id)) {
          return { ...p, tokens: p.tokens + 1 };
        }
        return p;
      })
    );*/
  };

  useEffect(() => { // IMPROVE IMMENSELLY
    if (mode !== "run") return;
    const handleKeyDown = (e) => {
      setCharacter(prev => {
        let { x, y, size } = prev;
        const step = 10;
        if (e.key === "ArrowUp") y -= step;
        if (e.key === "ArrowDown") y += step;
        if (e.key === "ArrowLeft") x -= step;
        if (e.key === "ArrowRight") x += step;
        return { ...prev, x, y };
      });
      if (e.key === " ") { //spacebar key
        //check proximity to set assets
        currentScene.transitions.forEach((t) => {
          if (!t.asset || !t.asset.assetPosition) return; //return nothing if t.asset doesnt exist
          const dx = character.x - t.asset.assetPosition?.x;
          const dy = character.y - t.asset.assetPosition?.y;
          //console.log(character.x + " , " + character.y + " and " + dx + " , " + dy);
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            console.log("interacted");
            fireTransition(t.id);
          }
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, character, currentScene]);

  const backgroundImage = useImage(currentScene.background)[0]; //preload the background image so useImage works

  return (
    <div>
      <Topbar 
      mode={mode}
      setMode={setMode}
      scenes={scenes}
      currentSceneId={currentSceneId}
      setCurrentSceneId={setCurrentSceneId}
      onAddScene={handleAddScene}
      />
      <div className="container">
      <Toolbar
        //tools
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}

        //assets library
        showAssetLibrary={showAssetLibrary}
        setShowAssetLibrary={setShowAssetLibrary}
        userImages={userImages}
        userAudios={userAudios}
        handleImageUpload={handleImageUpload}
        handleAudioUpload={handleAudioUpload}
        availableImages={[
          { type: "image", src: "./assets/imgs/objects/door.png" },
          { type: "image", src: "./assets/imgs/objects/RPG_key.png" },
          { type: "image", src: "./assets/imgs/objects/RPG_NPC.png" },
          { type: "image", src: "./assets/imgs/objects/RPG_bag.png" },
        ]}
        availableSounds={[
          { type: "audio", src: "./assets/audio/yippee-tbh-creature-jazz.mp3" },
        ]}
        onSelectImage={img => {/* logic to use selected image */}}
        onSelectAudio={aud => {/* logic to use selected audio */}}
      />
        <Stage className="canvas" width={width+100} height={height+100} onClick={handleStageClick} /*scaleX={stageScale} scaleY={stageScale} x={stagePosition.x} y={stagePosition.y}*/ ref={stageRef} onWheel={handleWheel} /*draggable*/>
          <Layer>
            <Group //working area to place elements
              ref={workspaceRef}
              //draggable={!isElementDragging}
              x={workspacePosition.x}
              y={workspacePosition.y}
              scaleX={workspaceScale}
              scaleY={workspaceScale}
              //onDragMove={e => setWorkspacePosition(e.target.position())}
            >
              <Rect //visible working area
                x={-WORKSPACE_SIZE/2}
                y={-WORKSPACE_SIZE/2}
                width={WORKSPACE_SIZE}
                height={WORKSPACE_SIZE}
                fill="#a4a7df"
                stroke="#bbb"
                strokeWidth={4}
                listening={false}
              />
              {/* Render Places */}
              {currentScene.places.map((p) => (
              <Group
                key={p.id}
                x={p.x}
                y={p.y}
                draggable
                onClick={() => handleElementClick(p.id, "place")}
                onDragMove={(e) => handleDragMove(e, p.id, "place")}
                /*onDragStart={e => {
                  setIsElementDragging(true);
                  e.cancelBubble = true;
                }}
                onDragEnd={e => {
                  setIsElementDragging(false);
                  e.cancelBubble = true;
                  handleDragMove(e, p.id, "place");
                }}*/
                onContextMenu={(e) => handleContextMenu(e, p.id, "place")}
              >
                <Circle
                  radius={PLACE_RADIUS}
                  fill="white"
                  stroke="black"
                  strokeWidth={BORDER_SIZE}
                />
                {p.asset?.image && <AssetRenderer x={0} y={0} asset={p.asset} />}
                <Text
                  x={-5}
                  y={-5}
                  text={p.tokens.toString()}
                  fontSize={14}
                  fill="black"
                />
              </Group>
              ))}
  
              {/* Render Transitions */}
              {currentScene.transitions.map((t) => (
              <Group
                key={t.id}
                x={t.x}
                y={t.y}
                draggable
                onClick={() => handleElementClick(t.id, "transition")}
                onDragMove={(e) => handleDragMove(e, t.id, "transition")}
                /*onDragStart={e => {
                  setIsElementDragging(true);
                  e.cancelBubble = true;
                }}
                onDragEnd={e => {
                  setIsElementDragging(false);
                  e.cancelBubble = true;
                  handleDragMove(e, t.id, "transition");
                }}*/
                onContextMenu={(e) => handleContextMenu(e, t.id, "transition")}
              >
                {t.asset?.image && <AssetRenderer x={0} y={-TRANSITION_HEIGHT*2.9} asset={t.asset} />}
                <Rect
                  x={-TRANSITION_WIDTH/2}
                  y={-TRANSITION_HEIGHT/2}
                  width={TRANSITION_WIDTH}
                  height={TRANSITION_HEIGHT}
                  fill="white"
                  stroke="black"
                  strokeWidth={BORDER_SIZE}
                  cornerRadius={5}
                />
                <Text
                  x={-TRANSITION_WIDTH / 4}
                  y={-TRANSITION_HEIGHT / 2 + 12}
                  text={"Action"}
                  fontSize={14}
                  fill="black"
                />
              </Group>
              ))}  
              {/* Render Arcs */}
              {currentScene.arcs.map((arc, index) => (
                <Arrow
                  key={index}
                  points={calculateArrowPoints(arc.from, arc.to)}
                  stroke="black" fill="white"
                  lineCap="round" lineJoin="round"
                  pointerLength={12} pointerWidth={15}
                  //dashEnabled dash={20}
                  //bezier="true" tension={5}
                  strokeWidth={BORDER_SIZE}
                  hitStrokeWidth={BORDER_SIZE+8}
                  onContextMenu={(e) => handleContextMenu(e, index, "arc")}
                />
              ))}
            </Group>
          </Layer>
        </Stage>
        {
        mode === "run" && !debug && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              background: "black",
            }}
          >
            <Stage width={window.innerWidth} height={window.innerHeight}>
              <Layer>
                {/* Background */}
                <Image
                  x={0}
                  y={0}
                  width={window.innerWidth}
                  height={window.innerHeight}
                  image={backgroundImage}
                />
                {/* Actions (Transitions) */}
                {currentScene.transitions.map((t) =>
                  t.asset?.image ? (
                    <LoadImage
                      key={t.id}
                      x={t.asset.assetPosition?.x ?? 50}
                      y={t.asset.assetPosition?.y ?? 0}
                      src={t.asset.image.src}
                      width={100}
                      height={200}
                    />
                  ) : null
                )}
                {/* Character */}
                <Circle
                  x={character.x}
                  y={character.y}
                  radius={character.size / 2}
                  fill="red"
                />
              </Layer>
            </Stage>
          </div>
        )}
        {/*<Properties />*/}
        <Properties selectedElement={selectedElement} updateElementAsset={updateElementAsset} />
        </div>
      {contextMenu && (
        <div
          style={{
          position: "absolute",
          top: contextMenu.y,
          left: contextMenu.x,
          background: "white",
          padding: "5px",
          border: "1px solid black",
          zIndex: 1000}}
        >
          <button onClick={deleteElement}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default App;