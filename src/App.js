/*
to do (edit mode)
fix arrow bugs - arrow position
fix everything about the UI - make the canvas scrollable
                            - make the canvas resizable (fix)
                            - hide bars option (optionally)
                            - add a button to add a new scene in the top bar
                            - add the asset library to the toolbar
add entry and exit points
make the properties panel work - fix partial firing checkbox
                               - add naming of elements
                               - add sound and image upload
                               - add sound play types (cyclic, once, etc)
                               - make entry and exit points association by name
                               - add x and y coordinates to the elements with images (to be rendered in the "game")
associate images and sounds to places and actions
add a library of images and sounds
add a load of different action types (use, take, open, etc)


to do (run mode)
add a character prototype (for now) to move around with arrow keys
place the places and transitions images in the predefined positions (dictated from the edit mode) as well as background
fix the firing of tokens - make it run while "playing the game" (when character approaches and interacts with the image associated with the transition)
*/

import React, { useState, useRef } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Image, Group } from "react-konva";
import useImage from "use-image";
import Topbar from "./components/Topbar.js";
import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";
/*import { usePlaceState, useTransitionState, useArcState, useModeState } from "./components/hooks.js";
import { isOverlapping, calculateArrowPoints } from "./components/utils.js";
import { handleWheel, handleStageClick } from "./components/actions.js";
import { PlaceElement, TransitionElement, ArcElement } from ".components/elementsjs";*/

// Predefined assets
/*const assets = {
  key: require("./assets/imgs/objects/RPG_key.png"),
  door: require("./assets/imgs/objects/door.png"),
  sound1: new Audio(require("./assets/audio/yippee-tbh-creature-jazz.mp3")),
};*/

const App = () => {
  const GAP_SIZE = 7;
  const BORDER_SIZE = 2;
  const PLACE_RADIUS = 20;
  const TRANSITION_WIDTH = 100;
  const TRANSITION_HEIGHT = 40;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const stageRef = useRef(null);

  const handleWheel = (e) => { //taken from the konva docs
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1;

    const scaleBy = 1.05;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  const [places, setPlaces] = useState([]);
  const [transitions, setTransitions] = useState([]);
  //const [arcs, setArcs] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [mode, setMode] = useState("edit"); // Modes: "edit", "run"
  const [selectedTool, setSelectedTool] = useState(null); // none, places, transitions, arrows
  const [contextMenu, setContextMenu] = useState(null); // delete and TBA
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [nextPlaceId, setNextPlaceId] = useState(1);
  const [nextTransitionId, setNextTransitionId] = useState(1);

    const [scenes, setScenes] = useState([ //array of scenes
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
  ]);
  
  const [currentSceneId, setCurrentSceneId] = useState(1); // Default to the first scene

  const currentScene = scenes.find((scene) => scene.id === currentSceneId);

  const isOverlapping = (x, y) => {
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

    const angle = Math.atan2(y2 - y1, x2 - x1);

    if (from.type === "place") { //radius for places
      x1 += (GAP_SIZE + PLACE_RADIUS) * Math.cos(angle);
      y1 += (GAP_SIZE + PLACE_RADIUS) * Math.sin(angle);
    } else if (from.type === "transition") { //middle point for transitions
      x1 += (TRANSITION_WIDTH / 2) + (GAP_SIZE + TRANSITION_WIDTH / 2) * Math.cos(angle);
      y1 += (TRANSITION_HEIGHT / 2) + (GAP_SIZE + TRANSITION_HEIGHT / 2) * Math.sin(angle);
    }

    if (to.type === "place") {
      x2 -= (GAP_SIZE + PLACE_RADIUS) * Math.cos(angle);
      y2 -= (GAP_SIZE + PLACE_RADIUS) * Math.sin(angle);
    } else if (to.type === "transition") {
      x2 -= (-TRANSITION_WIDTH / 2) + (GAP_SIZE + TRANSITION_WIDTH / 2) * Math.cos(angle);
      y2 -= (-TRANSITION_HEIGHT / 2) + (GAP_SIZE + TRANSITION_HEIGHT / 2) * Math.sin(angle);
    }

    return [x1, y1, x2, y2];
  };

  const handleStageClick = (e) => { //handel clicking on the canvas
    
    if (e.target === e.target.getStage()) { //clicked the canvas but not an element
      setConnectingFrom(null); //cancell connection if there is one
      //console.log("connection cancelled");
      setSelectedElement(null); //deselect element
      setContextMenu(null); //close the delete menu
    }
    if (e.evt.button !== 0 || mode !== "edit") return; //return if not in edit mode
    
    const { x, y } = e.target.getStage().getPointerPosition();
    if (isOverlapping(x, y)) {
      console.log("overlapping with another");
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
      const element = type === "place"
      ? currentScene.places.find((p) => p.id === id)
      : currentScene.transitions.find((t) => t.id === id);

      setSelectedElement({ id, type, asset: element?.asset || null });

      if (selectedTool !== "arc") { //cancel connection if not arc tool
        setConnectingFrom(null);
        return;
      }
  
      if (!connectingFrom) { //start connecting elements with arcs
        setConnectingFrom({ id, type });
        //console.log("connecting");
      } else if (connectingFrom.id !== id && connectingFrom.type !== type) {
        //console.log("connected");
        //setArcs([...arcs, { from: connectingFrom, to: { id, type } }]);
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

    /*if (type === "place") {
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    } else if (type === "transition") {
      setTransitions((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
      /*setTransitions((prev) => //centers the rectangle but jitters AAAA
        prev.map((t) => {
          if (t.id === id) {
            const newX = x - (TRANSITION_WIDTH / 2);
            const newY = y - (TRANSITION_HEIGHT / 2);
            return { ...t, x: newX, y: newY };
          }
          return t;
        })
      );*/
    /*}*/
  };

  const handleContextMenu = (e, id, type) => { //right click on an element
    setConnectingFrom(null);
    e.evt.preventDefault();
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, id, type });
  };

  const deleteElement = () => { //delete the selected element
    setConnectingFrom(null);
    if (!contextMenu) return;
    const { id, type } = contextMenu;
    /*if (type === "arc") {
      setArcs(arcs.filter((_, index) => index !== id));
    } else {
      //console.log(id);
      setPlaces(places.filter((p) => p.id !== id));
      setTransitions(transitions.filter((t) => t.id !== id));
      setArcs(arcs.filter((arc) => arc.from.id !== id && arc.to.id !== id));
    }*/
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              arcs: scene.arcs.filter((arc) => arc.from.id !== id && arc.to.id !== id),
              places: type === "place" ? scene.places.filter((p) => p.id !== id) : scene.places,
              transitions: type === "transition" ? scene.transitions.filter((t) => t.id !== id) : scene.transitions,
            }
          : scene
      );
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

  const updateElementAsset = (id, type, { image, sound, allowPartialFiring }) => {
    const updatedScenes = scenes.map((scene) =>
      scene.id === currentSceneId
        ? {
            ...scene,
            [type === "place" ? "places" : "transitions"]: scene[
              type === "place" ? "places" : "transitions"
            ].map((el) =>
              el.id === id
                ? {
                    ...el,
                    asset: { image, sound },
                    allowPartialFiring: allowPartialFiring ?? el.allowPartialFiring,
                  }
                : el
            ),
          }
        : scene
    );
    setScenes(updatedScenes);

    if (type === "place") {
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, asset: { image, sound } } : p
        )
      );
    } else if (type === "transition") { 
      setTransitions((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, asset: { image, sound }, allowPartialFiring: allowPartialFiring ?? t.allowPartialFiring } //question mark is optional chaining
            : t
        )
      );
    }
  
    //update the selectedElement if it matches the updated element
    if (selectedElement?.id === id && selectedElement?.type === type) {
      setSelectedElement((prev) => ({
        ...prev,
        asset: { image, sound },
        allowPartialFiring: allowPartialFiring ?? prev.allowPartialFiring,
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
    console.log(allInputsHaveTokens);
  
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

  /*const fireTransition = (transitionId) => {
    const transition = transitions.find((t) => t.id === transitionId);
    if (!transition) return;

    const inputPlaces = arcs.filter((arc) => arc.to.id === transitionId).map((arc) => arc.from.id);
    const outputPlaces = arcs.filter((arc) => arc.from.id === transitionId).map((arc) => arc.to.id);

    if (inputPlaces.some((id) => (places.find((p) => p.id === id)?.tokens || 0) < 1)) return;

    setPlaces((prev) =>
      prev.map((p) =>
        inputPlaces.includes(p.id)
          ? { ...p, tokens: p.tokens - 1 }
          : outputPlaces.includes(p.id)
          ? { ...p, tokens: p.tokens + 1 }
          : p
      )
    );

    if (transition.action === "playSound") {
      assets.sound1.play();
    }
  };*/

  return (
    <div>
      <Topbar 
      mode={mode}
      setMode={setMode}
      scenes={scenes}
      currentSceneId={currentSceneId}
      setCurrentSceneId={setCurrentSceneId}
      />
      <div className="container">
      <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
        <Stage className="canvas" width={1000} height={height} onClick={handleStageClick} ref={stageRef} onWheel={handleWheel} /*draggable*/>
          <Layer>
          {/* Render Places */}
          {currentScene.places.map((p) => (
            <Group
              key={p.id}
              x={p.x}
              y={p.y}
              draggable
              onClick={() => handleElementClick(p.id, "place")}
              onDragMove={(e) => handleDragMove(e, p.id, "place")}
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
              onContextMenu={(e) => handleContextMenu(e, t.id, "transition")}
            >
              {t.asset?.image && <AssetRenderer x={TRANSITION_WIDTH/2} y={-TRANSITION_HEIGHT*2.5} asset={t.asset} />}
              <Rect
                width={TRANSITION_WIDTH}
                height={TRANSITION_HEIGHT}
                fill="white"
                stroke="black"
                strokeWidth={BORDER_SIZE}
                cornerRadius={5}
              />
              <Text
                x={TRANSITION_WIDTH / 4}
                y={TRANSITION_HEIGHT / 2 - 5}
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
          </Layer>
        </Stage>
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

//return (
//  <div>
//    <Topbar />
//    <button onClick={() => setMode(mode === "edit" ? "run" : "edit")}>
//      {mode === "edit" ? "Switch to Run Mode" : "Switch to Edit Mode"}
//    </button>
//    <Stage width={800} height={600}>
//      <Layer>
//        {places.map((p) => {
//          const [image] = useImage(assets[p.asset]);
//          return (
//            <>
//              <Circle key={p.id} x={p.x} y={p.y} radius={20} fill="white" stroke="black" strokeWidth={2} />
//              {mode === "run" && image && <Image x={p.x - 15} y={p.y - 15} image={image} width={30} height={30} />}
//              <Text x={p.x - 5} y={p.y - 5} text={p.tokens.toString()} fontSize={14} fill="black" />
//            </>
//          );
//        })}
//        {transitions.map((t) => (
//          <Rect
//            key={t.id}
//            x={t.x}
//            y={t.y}
//            width={40}
//            height={40}
//            fill="white"
//            stroke="black"
//            strokeWidth={2}
//            onClick={() => mode === "run" && fireTransition(t.id)}
//          />
//        ))}
//        {arcs.map((arc, index) => (
//          <Arrow key={index} points={[100, 100, 300, 100]} stroke="black" fill="white" strokeWidth={2} />
//        ))}
//      </Layer>
//    </Stage>
//  </div>
//);
};

export default App;


//import React, { useState } from "react";
//import usePetriNet from "./components/PetriNet.js";
//import Topbar from "./components/Topbar.js";
//import Toolbar from "./components/Toolbar.js";
//import Properties from "./components/Propertybar.js";
//
//const App = () => {
//  const BORDER_SIZE = 2;
//  const PLACE_RADIUS = 20;
//  const TRANSITION_WIDTH = 80;
//  const TRANSITION_HEIGHT = 40;
//
//  const { places, transitions, arcs, addPlace, addTransition, startConnection, completeConnection, mode, connectingFrom } = usePetriNet();
//  const [mousePos, setMousePos] = useState(null);
//
//  const CanvasClick = (e) => {
//    const { offsetX, offsetY } = e.nativeEvent;
//
//    if (mode === "place") addPlace(offsetX, offsetY);
//    if (mode === "transition") addTransition(offsetX, offsetY);
//  };
//
//  /*const handleMouseMove = (e) => {
//    if (connectingFrom) {
//      setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
//    }
//  }*/
//
//  const [draggingArc, setDraggingArc] = useState(null);
//
//  const handleMouseDown = (id) => {
//    if (mode === "arc") {
//      setDraggingArc(id); //start dragging from this element
//    }
//  };
//
//  const handleMouseUp = (id) => {
//    if (mode === "arc" && draggingArc) {
//      completeConnection(id); //complete connection if released on another element
//    }
//    setDraggingArc(null); //stop dragging in any case
//  };
//
//  const handleMouseMove = (e) => {
//    if (draggingArc || connectingFrom) {
//      setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
//    }else {
//      setMousePos(null); // Hide the temp arc when no connection active
//  }
//  };
//
//  /*const handleMouseMove = (e) => {
//    if (connectingFrom) {
//        setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
//    } else {
//        setMousePos(null); // Hide the temp arc when no connection active
//    }};    
//  };*/
//
//  const lineIntersectionOnRect = (width, height, xB, yB, xA, yA) => {
//    const w = width / 2 ;
//    const h = height / 2;
//    const dx = xA - xB;
//    const dy = yA - yB;
//
//    //if A=B return B itself
//    if (dx == 0 && dy == 0) return {
//      x: xB,
//      y: yB
//    };
//    const tan_phi = h / w;
//    const tan_theta = Math.abs(dy / dx);
//  
//    //tell me in which quadrant the A point is
//    const qx = Math.sign(dx);
//    const qy = Math.sign(dy);
//
//    let xI = 0, yI = 0;
//  
//    if (tan_theta > tan_phi) {
//      xI = xB + (h / tan_theta) * qx;
//      yI = yB + h * qy;
//    } else {
//      xI = xB + w * qx;
//      yI = yB + w * tan_theta * qy;
//    }
//  
//    return {
//      x: xI,
//      y: yI
//    };
//      
//  }
//
//  const calculateEdgePoint = (from, to) => { //properly connect elements
//    const dx = to.x - from.x;
//    const dy = to.y - from.y;
//    const length = Math.sqrt(dx * dx + dy * dy);
//    const ux = dx / length;
//    const uy = dy / length;
//  
//    let fromOffsetX = 0, fromOffsetY = 0, toOffsetX = 0, toOffsetY = 0;
//  
//    if (from.type === "place") { //radius for places
//      fromOffsetX = PLACE_RADIUS * ux;
//      fromOffsetY = PLACE_RADIUS * uy;
//    } else { //middle face for transitions
//      const halfWidth = TRANSITION_WIDTH / 2 ;
//      const halfHeight = TRANSITION_HEIGHT / 2;
//  
//      if (Math.abs(dx) > Math.abs(dy)) {
//        fromOffsetX = dx > 0 ? halfWidth : -halfWidth;
//      } else {
//        fromOffsetY = dy > 0 ? halfHeight : -halfHeight;
//      }
//    }
//  
//    if (to.type === "place") {
//      //toOffsetX = -(PLACE_RADIUS+(BORDER_SIZE*5)) * ux; toOffsetY = -(PLACE_RADIUS+(BORDER_SIZE*5)) * uy;
//      fromOffsetX = PLACE_RADIUS * ux; fromOffsetY = PLACE_RADIUS * uy;
//    } else {
//      /*const halfWidth = (TRANSITION_WIDTH / 2) +10;
//      const halfHeight = (TRANSITION_HEIGHT / 2) +10;*/
//      const halfWidth = TRANSITION_WIDTH / 2;
//      const halfHeight = TRANSITION_HEIGHT / 2;
//  
//      if (Math.abs(dx) > Math.abs(dy)) {
//        toOffsetX = dx > 0 ? -halfWidth : halfWidth;
//      } else {
//        toOffsetY = dy > 0 ? -halfHeight : halfHeight;
//      }
//      let coords = lineIntersectionOnRect(TRANSITION_WIDTH, TRANSITION_HEIGHT, dx, dy, from.x + fromOffsetX, from.y + fromOffsetY);
//      console.log(coords);
//      console.log(to.x + toOffsetX + " and " + to.y + toOffsetY);
//    }
//  
//    return {
//      x1: from.x + fromOffsetX,
//      y1: from.y + fromOffsetY,
//      x2: to.x + toOffsetX,
//      y2: to.y + toOffsetY,
//    };
//  };  
//
//  return (
//    <div>
//      <Topbar />
//      <div class="container">
//        <Toolbar />
//        <svg class="canvas" onClick={CanvasClick} onMouseMove={handleMouseMove}>
//          
//
//          {/* Places */}
//          {places.map((place) => (
//            <circle key={place.id} cx={place.x} cy={place.y} r={PLACE_RADIUS} fill="white" stroke="black" strokeWidth={BORDER_SIZE}
//           /* onClick={(e) => {
//              e.stopPropagation();
//              if (mode === "arc") {
//                if (connectingFrom) {
//                  completeConnection(place.id);
//                  setMousePos(null); // Clears the preview line
//                } else {
//                  startConnection(place.id);
//                }
//              }
//            }}  */
//            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(place.id); }}
//            onMouseUp={(e) => {
//              e.stopPropagation();
//              handleMouseUp(place.id);
//              //if (mode === "arc") {
//                if (connectingFrom) {
//                  completeConnection(place.id);
//                  setMousePos(null); // Clears the preview line
//                } else {
//                  startConnection(place.id);
//                }
//              //}
//            }}
//          />
//          ))}
//
//          {/* Transitions */}
//          {transitions.map((transition) => (
//            <rect key={transition.id} x={transition.x - TRANSITION_WIDTH/2} y={transition.y - TRANSITION_HEIGHT/2}
//            width={TRANSITION_WIDTH} height={TRANSITION_HEIGHT} fill="white" stroke="black" strokeWidth={BORDER_SIZE}
//            /*onClick={(e) => {
//              e.stopPropagation();
//              if (mode === "arc") {
//                if (connectingFrom) {
//                  completeConnection(transition.id);
//                  setMousePos(null); // Clears the preview line
//                } else {
//                  startConnection(transition.id);
//                }
//              }
//            }}*/
//            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(transition.id); }}
//            onMouseUp={(e) => {
//              e.stopPropagation();
//              handleMouseUp(transition.id);
//              //if (mode === "arc") {
//                if (connectingFrom) {
//                  completeConnection(transition.id);
//                  setMousePos(null); // Clears the preview line
//                } else {
//                  startConnection(transition.id);
//                }
//              //}
//            }}/>
//          ))}
//
//          {/* Arrowhead */}
//          <defs>
//            <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
//              <path d="M 0 0 L 10 5 L 0 10 L 5 5 z" fill="black"/>
//            </marker>
//          </defs>
//
//          {/* Arcs (with arrow) */}
//          {arcs.map((arc, index) => {
//            const from = [...places, ...transitions].find((el) => el.id === arc.from);
//            const to = [...places, ...transitions].find((el) => el.id === arc.to);
//
//            if (!from || !to) return null;
//              
//            const { x1, y1, x2, y2 } = calculateEdgePoint(from, to);
//
//            //vector direction
//            /*const dx = to.x - from.x;
//            const dy = to.y - from.y;
//            const length = Math.sqrt(dx * dx + dy * dy);
//
//            //normalize vector
//            const ux = dx / length;
//            const uy = dy / length;
//
//            //
//            const fromRadius = from.id.startsWith("P") ? PLACE_RADIUS : TRANSITION_WIDTH/2;
//            const toRadius = to.id.startsWith("P") ? PLACE_RADIUS : TRANSITION_WIDTH/2;
//
//            //adjust start and end points
//            const x1 = from.x + ux * fromRadius;
//            const y1 = from.y + uy * fromRadius;
//            const x2 = to.x - ux * toRadius;
//            const y2 = to.y - uy * toRadius;*/
//
//            return (
//              <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={BORDER_SIZE} markerEnd="url(#arrow)" // Arrowhead always visible
//              />
//            );
//            /*return (
//              <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={BORDER_SIZE} markerEnd="url(#arrow)" // Arrowhead always visible
//              />
//            );*/
//          })}
//
//          {/* Temporary arc preview while connecting */}
//          {/*connectingFrom && mousePos && (
//            <line x1={places.find((p) => p.id === connectingFrom)?.x || transitions.find((t) => t.id === connectingFrom)?.x}
//                  y1={places.find((p) => p.id === connectingFrom)?.y || transitions.find((t) => t.id === connectingFrom)?.y}
//                  x2={mousePos.x} y2={mousePos.y}*/
//          draggingArc && mousePos && (
//            <line x1={places.find((p) => p.id === draggingArc)?.x || transitions.find((t) => t.id === draggingArc)?.x}
//                  y1={places.find((p) => p.id === draggingArc)?.y || transitions.find((t) => t.id === draggingArc)?.y}
//                  x2={mousePos.x} y2={mousePos.y}
//                  stroke="gray" strokeWidth={BORDER_SIZE} strokeDasharray="5,5" />
//          )}
//        </svg>
//        {/*<Properties />*/}
//      </div>
//    </div>
//  );
//};
//
//export default App;