import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Image, Group, Line } from "react-konva";
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
const INTERACT_AREA = 100;
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
  const [userBackgrounds, setUserBackgrounds] = useState([]); //backgrounds from user in asset library
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

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
    /*{
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
    },*/
  ]);
  const [currentSceneId, setCurrentSceneId] = useState(1); //default to the first scene
  const currentScene = scenes.find((scene) => scene.id === currentSceneId);

  const handleAddScene = () => {
    setShowBackgroundSelector(true);
  };

  const handleSelectBackgroundForScene = (bg) => {
    setScenes(prev => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Scene ${prev.length + 1}`,
        background: bg.src,
        places: [],
        transitions: [],
        arcs: [],
      }
    ]);
    setShowBackgroundSelector(false);
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

  const handleBackgroundsUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserBackgrounds(prev => [...prev, { src: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const allAvailableImages = [ //combine preloaded and user-uploaded imags
    { type: "image", src: "./assets/imgs/objects/door.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_key.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_NPC.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_bag.png" },
    ...userImages,
  ];

  const allAvailableSounds = [ //combine preloaded and user-uploaded audios
    { type: "audio", src: "./assets/audio/yippee-tbh-creature-jazz.mp3" },
    ...userAudios,
  ];

  const allAvailableBackgrounds = [
    { type: "background", src: "./assets/imgs/scenes/forest_scene.jpg" },
    { type: "background", src: "./assets/imgs/scenes/mineshaftexit_scene.png" },
    { type: "background", src: "./assets/imgs/scenes/redmoon_scene.png" },
    { type: "background", src: "./assets/imgs/scenes/waterfalls_scene.jpg" },
    { type: "background", src: "./assets/imgs/scenes/grasslands_scene.png" },
    ...userBackgrounds,
  ];

  const isOverlapping = (x, y) => { //when placing an element, check if there is one already
    return (
      currentScene.places.some((p) => Math.hypot(p.x - x, p.y - y) < PLACE_RADIUS+10) ||
      currentScene.transitions.some((t) => Math.abs(t.x - x) < TRANSITION_WIDTH / 2 && Math.abs(t.y - y) < TRANSITION_HEIGHT / 2)
    );
  };

  const calculateArrowPoints = (from, to) => { //calculate the beginning and end points of the arrow
    const fromElement = currentScene.places.find((p) => p.id === from.id) || currentScene.transitions.find((t) => t.id === from.id);
    const toElement = currentScene.places.find((p) => p.id === to.id) || currentScene.transitions.find((t) => t.id === to.id);
    
    if (!fromElement || !toElement) return []; //
    if (fromElement?.placeType === "exit") return []; // can't start from exit
    if (toElement?.placeType === "entry") return []; // can't end at entry

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

    if (selectedTool === "place" || selectedTool === "entry" || selectedTool === "exit") { // sets the places, entry and exit points for the scene
      const placeType = selectedTool === "place" ? "normal" : selectedTool;
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              places: [
                ...scene.places,
                { id: `p${nextPlaceId}`, x, y, tokens: 0, placeType, name: "" }
              ],
            }
          : scene
      );
      setScenes(updatedScenes);
      setNextPlaceId(nextPlaceId + 1);
    } else if (selectedTool === "transition" || selectedTool === "sensor" || selectedTool === "talk" || selectedTool === "look" || selectedTool === "interact") { // sets the transmitions for the scene
      const transitionType = selectedTool;// === "transition" ? "sensor" : selectedTool;
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              transitions: [...scene.transitions, { id: `t${nextTransitionId}`, x, y, transitionType, name: transitionType.charAt(0).toUpperCase() + transitionType.slice(1), }],
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
          placeType: element?.placeType || "normal", //not sure if specification necessary
          name: element?.name || null,
        });
      } else if (type === "transition") {
        element = currentScene.transitions.find((t) => t.id === id);
        setSelectedElement({
          id,
          type,
          asset: element?.asset || null,
          allowPartialFiring: element?.allowPartialFiring ?? false,
          transitionType: element?.transitionType || "sensor", //or "talk", "look", "interact" wtv
          name: element?.name ||"Interact",
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
        x={x - desiredWidth / 2}
        y={y + desiredHeight - 10}
        image={image}
        width={desiredWidth}
        height={desiredHeight}
      />
    );
  };

  const updateElementAsset = (id, type, asset, allowPartialFiring, name) => {
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
                  asset: asset !== undefined ? { ...element.asset, ...asset } : element.asset,
                  ...(typeof allowPartialFiring !== "undefined"
                    ? { allowPartialFiring }
                    : {}),
                  ...(typeof name !== "undefined"
                    ? { name }
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
        asset: asset !== undefined ? { ...prev.asset, ...asset } : prev.asset,
        ...(typeof allowPartialFiring !== "undefined"
          ? { allowPartialFiring }
          : {}),
        ...(typeof name !== "undefined"
          ? { name }
          : {}),
        }));
    }
  };

  const fireTransition = (transitionId) => {
    const transition = currentScene.transitions.find((t) => t.id === transitionId);
    if (!transition) return; // only transitions fire tokens
  
    const inputPlaces = currentScene.arcs.filter((arc) => arc.to.id === transitionId).map((arc) => arc.from.id);
    const outputPlaces = currentScene.arcs.filter((arc) => arc.from.id === transitionId).map((arc) => arc.to.id);
  
    //check if all input places have at least one token (for or/and logic)
    const allInputsHaveTokens = inputPlaces.every((id) => (currentScene.places.find((p) => p.id === id)?.tokens || 0) >= 1);
    if (!transition.allowPartialFiring && !allInputsHaveTokens) return;
    if (transition.allowPartialFiring && allInputsHaveTokens) return;
  
    const changedNames = {};
  
    //update tokens for input and output places in the current scene
    const updatedScenes = scenes.map((scene) =>
      scene.id === currentSceneId
        ? {
            ...scene,
            places: scene.places.map((p) => {
              // INPUT: Decrease num tokens
              if (inputPlaces.includes(p.id)) {
                if ((p.placeType === "entry" || p.placeType === "exit") && p.name) {
                  const newTokens = Math.max(p.tokens - 1, 0);
                  changedNames[p.name] = newTokens;
                  return { ...p, tokens: newTokens };
                }
                return { ...p, tokens: Math.max(p.tokens - 1, 0) };
              }
              // OUTPUT: Increment num tokens
              if (outputPlaces.includes(p.id)) {
                if ((p.placeType === "entry" || p.placeType === "exit") && p.name) {
                  const newTokens = p.tokens + 1;
                  changedNames[p.name] = newTokens;
                  return { ...p, tokens: newTokens };
                }
                return { ...p, tokens: p.tokens + 1 };
              }
              return p;
            }),
          }
        : scene
    );
  
    //synchronize all entry/exit places with the same name
    const syncedScenes = updatedScenes.map((scene) => ({
      ...scene,
      places: scene.places.map((place) => {
        if ((place.placeType === "entry" || place.placeType === "exit") && place.name && changedNames.hasOwnProperty(place.name)) {
          return { ...place, tokens: changedNames[place.name] };
        }
        return place;
      }),
    }));
  
    setScenes(syncedScenes);
  };
  
  useEffect(() => { // IMPROVE IMMENSELLY WALKING AND PROXIMITY SENSOR
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
      currentScene.transitions.forEach((t) => {
        if (t.transitionType === "sensor") { //check proximity to set assets
            const dx = character.x - t.asset.assetPosition?.x;
            const dy = character.y - t.asset.assetPosition?.y;
            //console.log(character.x + " , " + character.y + " and " + dx + " , " + dy);
            if (Math.sqrt(dx * dx + dy * dy) < INTERACT_AREA) {
              console.log("interacted");
              fireTransition(t.id);
            }
          }
      });
      if (e.key === " ") { //spacebar key
        currentScene.transitions.forEach((t) => {
          if (t.transitionType === "talk") {
            //if (!t.asset || !t.asset.assetPosition) return; //return nothing if t.asset doesnt exist
            // Talk to logic
          } else if (t.transitionType === "look") {
            // Look at logic
          } else if (t.transitionType === "interact") { //basically always available
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
      selectedTool={selectedTool} setSelectedTool={setSelectedTool}
      />
      <div className="container">
      <Toolbar
        //tools
        selectedTool={selectedTool} setSelectedTool={setSelectedTool}
        //assets library
        showAssetLibrary={showAssetLibrary} setShowAssetLibrary={setShowAssetLibrary}
        //userImages={userImages} userAudios={userAudios} userBackgrounds ={userBackgrounds}
        handleImageUpload={handleImageUpload} handleAudioUpload={handleAudioUpload} handleBackgroundsUpload={handleBackgroundsUpload}
        availableImages={allAvailableImages} availableSounds={allAvailableSounds} availableBackgrounds={allAvailableBackgrounds}
        onSelectImage={img => {/* add a delete asset to be implemented aaa*/}}
        onSelectAudio={aud => {/* add a preview kinda to be implemented aaa */}}
        onSelectBackground={bg => {/* add a preview kinda to be implemented aaa */}}
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
                placeType={p.placeType}
                name={p.name}
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
                <Circle radius={PLACE_RADIUS} fill="white" stroke="black" strokeWidth={BORDER_SIZE} />
                {p.placeType === "normal" && (
                  <>
                  {p.asset?.image && <AssetRenderer x={0} y={0} asset={p.asset} />}
                  {/*<Text x={-PLACE_RADIUS} y={-5} width={PLACE_RADIUS * 2} align="center" text={p.tokens.toString()} fontSize={14} fill="black" />*/}
                  </>
                )}
                {p.placeType === "entry" && (
                  <Circle radius={PLACE_RADIUS/8} fill="black" />
                )}
                {p.placeType === "exit" && (
                  <>
                  <Line points={[8-PLACE_RADIUS-BORDER_SIZE, 8-PLACE_RADIUS-BORDER_SIZE, PLACE_RADIUS-BORDER_SIZE-4, PLACE_RADIUS-BORDER_SIZE-4]}
                  stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
                  <Line points={[8-PLACE_RADIUS-BORDER_SIZE, PLACE_RADIUS-BORDER_SIZE-4, PLACE_RADIUS-BORDER_SIZE-4, 8-PLACE_RADIUS-BORDER_SIZE]}
                  stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
                  </>
                )}
                <Text x={-PLACE_RADIUS} y={-5} width={PLACE_RADIUS * 2} align="center" text={p.tokens.toString()} fontSize={14} fill="black" />
                <Text x={-PLACE_RADIUS*2} y={25} width={PLACE_RADIUS * 4} align="center" text={p.name} fontSize={14} fill="black" />
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
                  x={-TRANSITION_WIDTH/4}
                  y={-TRANSITION_HEIGHT / 2 + 12}
                  text={t.name}
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
        <div class="scene-background">
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
                    x={t.asset.assetPosition?.x ?? window.innerWidth*0.15}
                    y={t.asset.assetPosition?.y ?? window.innerHeight*0.85}
                    src={t.asset.image.src}
                    width={t.asset.assetSize?.width}
                    height={t.asset.assetSize?.height}
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
      <Properties
        selectedElement={selectedElement} updateElementAsset={updateElementAsset}
        availableImages={allAvailableImages} availableSounds={allAvailableSounds}
        selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
      </div>
      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div class="background-selector-overlay">
          <div class="background-selector">
            <h3>Select a background for the new scene</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "16px 0" }}>
              {allAvailableBackgrounds.map((bg, idx) => (
                <img class="background-selector-list"
                  key={idx}
                  src={bg.src}
                  alt={bg.name || "bg"}
                  onClick={() => handleSelectBackgroundForScene(bg)}
                />
              ))}
            </div>
            <button onClick={() => setShowBackgroundSelector(false)} style={{marginTop: 8}}>Cancel</button>
          </div>
        </div>
      )}
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