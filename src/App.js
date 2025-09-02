import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Image, Group, Line } from "react-konva";
import useImage from "use-image";

import Topbar from "./components/Topbar.js";
import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";
import SceneStage from "./components/SceneStage";
import SceneOverview from "./components/SceneOverview";

const WORKSPACE_SIZE = 5000;

const GAP_SIZE = 7; //7
const BORDER_SIZE = 2;
const PLACE_RADIUS = 20; //20
const TRANSITION_WIDTH = 100;
const TRANSITION_HEIGHT = 40;
const INTERACT_AREA = 100;
const debug = false; //true to show edit mode when "running"

let firstStarted = false; //only allows the start action to fire once and when reset

const App = () => {
  const width= window.innerWidth;
  const height= window.innerHeight;

  // workplace const
  const [workspaceScale, setWorkspaceScale] = useState(1);
  const [workspacePosition, setWorkspacePosition] = useState({ x: WORKSPACE_SIZE/4, y: 0 });
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
  const [selectedTool, setSelectedTool] = useState(null); //none, places, transitions, arrows, entry and exit points
  const [contextMenu, setContextMenu] = useState(null); // delete, fire tokens, reset properties
  const [usedTransitions, setUsedTransitions] = useState(new Set()); //tracks which transitions have been "used"
  const [wasAvailable, setWasAvailable] = useState(new Set()); //tracks which transitions have become available for asset visibility control
  const [connectingFrom, setConnectingFrom] = useState(null); //checks which element is selected prior to the arcs connection
  const [nextPlaceId, setNextPlaceId] = useState(1); //makes sure the places have diff ids
  const [nextTransitionId, setNextTransitionId] = useState(1); //makes sure the transitions have diff ids

  // asset library const
  const [userImages, setUserImages] = useState([]); //images from user in asset library
  const [userAudios, setUserAudios] = useState([]); //audios from user in asset library
  const [userBackgrounds, setUserBackgrounds] = useState([]); //backgrounds from user in asset library
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  // character and interaction const idk
  const [globalStartAsset, setGlobalStartAsset] = useState(null); //global set up for character
  const [canEnterRunMode, setCanEnterRunMode] = useState(false);
  const [character, setCharacter] = useState({ x: 100, y: 600, size: 100 }); //controlable character in run mode
  const [pressedKeys, setPressedKeys] = useState({}); //state for movement pressed keys
  const [activeDialogue, setActiveDialogue] = useState(null); //tracks the active dialogue {type, text, options}

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
    /*{
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
    },*/
  ]);
  const [currentSceneId, setCurrentSceneId] = useState(1); //default to the first scene
  const currentScene = scenes.find((scene) => scene.id === currentSceneId);
  const [sceneContextMenu, setSceneContextMenu] = useState(null); // { x, y, sceneId }

  // sound const
  const ambientAudioRef = useRef(null);
  const passThroughInsideRef = useRef(new Set());
  const playSound = (src, { loop = false, volume = 1 } = {}) => {
    if (!src) return null;
    try {
      const a = new Audio(src);
      a.loop = !!loop;
      a.volume = volume;
      a.play().catch(()=>{});
      return a;
    } catch (e) { return null; }
  };

  const startTransition = currentScene.transitions.find( //check if start transition is defined
    t => t.transitionType === "start" && t.asset?.image?.src
  );
  const characterAsset = startTransition?.asset || globalStartAsset;

  const handleAddScene = () => {
    setShowBackgroundSelector(true);
  };

  const handleSelectBackgroundForScene = (bg) => { //handles the addition of more scenes by picking a background image
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

  /*useEffect(() => { //activates when window is clicked on (debugging purposes)
    const handleCLick = () => {
      console.log(canEnterRunMode);
    };
    window.addEventListener("click", handleCLick);
    return () => window.removeEventListener("click", handleCLick);
  }, []);*/

  useEffect(() => { //flip modes with esc key
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (mode === "edit" && !canEnterRunMode) {
          console.log("nope");
          return;
        }
        setMode((prev) => (prev === "edit" ? "run" : "edit"));
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mode, canEnterRunMode]);

  useEffect(() => { //toggle overview with Tab
    const handleTab = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setMode((prev) => (prev === "overview" ? "edit" : "overview"));
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [mode]);

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

  const globalPlaceMap = {}; //map of entry/exit places by name across all scenes for inventory
  scenes.forEach(scene => {
    scene.places.forEach(p => {
      if ((p.placeType === "entry" || p.placeType === "exit") && p.name) {
        if (!globalPlaceMap[p.name]) { //add place to the mapping (if not already added)
          globalPlaceMap[p.name] = { tokens: 0, asset: p.asset, name: p.name, id: p.id };
        }
        globalPlaceMap[p.name].tokens += p.tokens ?? 0; //add the tokens from the place
        if (p.asset?.image) globalPlaceMap[p.name].asset = p.asset; //add image asset (if available)
      }
    });
  });

  const globalNormalPlaces = []; //array for ALL normal places with tokens and an image
  scenes.forEach(scene => { //adds places to the array
    scene.places.forEach(p => {
      if ( p.placeType === "normal" && p.asset?.image && (p.tokens ?? 0) > 0
      ) {
        globalNormalPlaces.push({
          id: p.id, image: p.asset.image, name: p.name || "",
        });
      }
    });
  });

  const inventoryItems = [ //inventory with all the gathered places with image assets and tokens
    ...Object.values(globalPlaceMap)  //get all the entry/exit places with image and tokens
      .filter(p => p.asset?.image && p.tokens > 0)
      .map(p => ({ id: p.id, image: p.asset.image, name: p.name || "", })),
    ...globalNormalPlaces //add the already filtered normal places
  ];

  const isOverlapping = (x, y) => { //when placing an element, check if there is one already there
    return (
      currentScene.places.some((p) => Math.hypot(p.x - x, p.y - y) < PLACE_RADIUS+10) ||
      currentScene.transitions.some((t) => Math.abs(t.x - x) < TRANSITION_WIDTH / 1.3 && Math.abs(t.y - y) < TRANSITION_HEIGHT / 1.3)
    );
  };

  const calculateArrowPoints = (from, to) => { //calculate the beginning and end points of the arrow
    const fromElement = currentScene.places.find((p) => p.id === from.id) || currentScene.transitions.find((t) => t.id === from.id);
    const toElement = currentScene.places.find((p) => p.id === to.id) || currentScene.transitions.find((t) => t.id === to.id);
    
    if (!fromElement || !toElement) return []; //
    if (fromElement?.placeType === "exit") return []; // can't start from exit
    if (toElement?.placeType === "entry") return []; // can't end at entry
    if (toElement?.transitionType === "start") return []; // can't end at start
    if (toElement?.transitionType === "talkOption") return []; // can't end at dialogue option

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
    
    //convert pointer position to workspace coordinates (for dragging and zooming)
    const pointer = stageRef.current.getPointerPosition();
    const group = workspaceRef.current;
    const groupPos = group.getAbsolutePosition();
    const x = (pointer.x - groupPos.x) / workspaceScale;
    const y = (pointer.y - groupPos.y) / workspaceScale;

    //const { x, y } = e.target.getStage().getPointerPosition();
    if (isOverlapping(x, y)) { //do nothing if overlapping
      //console.log("overlapping with another");
      return;}

    if (selectedTool === "place" || selectedTool === "entry" || selectedTool === "exit") { //sets the places, entry and exit points for the scene
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
    } else if (selectedTool === "transition" || selectedTool === "start" || selectedTool === "sensor" || selectedTool === "talk" || selectedTool === "look" || selectedTool === "interact") { //sets the transmitions for the scene
      if (selectedTool === "start") {
        if (globalStartAsset) return;
        firstStarted = true;
      }
      const transitionType = selectedTool;// === "transition" ? "sensor" : selectedTool;
      const defaultAsset = {};
      defaultAsset.showArea = true;
      defaultAsset.booleanSensor = true;
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              transitions: [...scene.transitions, { id: `t${nextTransitionId}`, x, y,
                                                    transitionType, name: transitionType.charAt(0).toUpperCase() + transitionType.slice(1), //name is setup automatically for transitions
                                                    asset: defaultAsset, }],
            }
          : scene
      );
      setScenes(updatedScenes);
      setNextTransitionId(nextTransitionId + 1);
    }
  };

  const handleElementClick = (id, type) => { //handle clicking on the places and transitions boxes in the canvas
    if (mode === "run" && type === "transition") {
      fireToken(id);
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
          transitionType: element?.transitionType || "interact", //or "talk", "look", "interact" wtv
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
          updatedScene.places = updatedScene.places.filter((p) => p.id !== id); //delete the selected place
        }
        if (type === "transition") {
          updatedScene.transitions = updatedScene.transitions.filter((t) => {
            if (t.id !== id) {
              return true; //keep the not selected transitions
            } else {
              if (t.transitionType === "start") {
                setGlobalStartAsset(null); //reset character asset
              }
              return false; //delete the selected transition
            }
          });
        }
        return updatedScene;
      }
      return scene;
    });
    setScenes(updatedScenes);
    setContextMenu(null);
  };

  const resetElement = () => { //resets the properties of the elements
    setConnectingFrom(null);
    if (!contextMenu) return;
    const { id, type } = contextMenu; //may be deprecated

    const updatedScenes = scenes.map((scene) => { //simplified version
      if (scene.id === currentSceneId) {
        const updatedScene = { ...scene };
        if (type === "place") { //resets number of tokens to zero
          updatedScene.places = updatedScene.places.map((p) => p.id === id ? { ...p, tokens: 0 } : p
        );
        }
        if (type === "transition") { //resets all of the properties for transitions
          updatedScene.transitions = updatedScene.transitions.map((t) => {
            if (t.transitionType === "start") {
              firstStarted = true;
            }

            if (t.id === id) { //resets ALL of them
              return {
                ...t,
                asset: {
                  ...t.asset,
                  areaSize: 70,
                  showArea: true,
                  booleanSensor: t.transitionType === "sensor" ? true : t.asset?.booleanSensor,
                  dialogueText: "",
                  dialogueOptions: [],
                  image: null,
                  sound: null,
                  assetSize: { width: 50, height: 50 },
                  assetPosition: { x: 0, y: 0 },
                  flipX: false,
                },
              };
            }
            return t;
          });
        }
        return updatedScene;
      }
      return scene;
    });
    setScenes(updatedScenes);
    setContextMenu(null);
  }

  const fireElement = () => { //fires a token from the selected transition
    setConnectingFrom(null);
    if (!contextMenu) return;
    const { id, type } = contextMenu;

    if (type === "transition") {
      fireToken(id); //fire the selected transition
    }
    setContextMenu(null);
  };

  const AssetRenderer = ({ x, y, asset }) => { //render the images in the edit canvas
    const [image] = useImage(asset?.image?.src || null);
    if (!image) return null;
  
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    const desiredWidth = 50;
    const desiredHeight = desiredWidth / aspectRatio;
  
    return (
      <Image
        x={x - desiredWidth / 2}
        y={y - desiredHeight}
        image={image}
        width={desiredWidth}
        height={desiredHeight}
        scaleX={asset?.flipX ? -1 : 1} //flip asset
        offsetX={asset?.flipX ? desiredWidth : 0} //fixed x position regardless of flip
      />
    );
  };

  const updateElementAsset = (id, type, asset, allowPartialFiring, name) => {
    if (type === "transition" && asset && selectedElement?.transitionType === "start") {
      setGlobalStartAsset({ ...selectedElement.asset, ...asset });
    }
    //updates the scene's array
    const updatedScenes = scenes.map((scene) => { //loops through all the scenes and only updates the current one
      if (scene.id === currentSceneId) {
        const typeUpdate = type === "place" ? "places" : "transitions"; //updates either places or transitions

        let updatedTransitions = scene.transitions.map((element) =>
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
        );

        //talk to option set up and placement
        const talkTransition = updatedTransitions.find(t => t.id === id && t.transitionType === "talk");
        if (talkTransition) {
          const options = talkTransition.asset?.dialogueOptions || [];
          updatedTransitions = updatedTransitions.filter(// remove old talkOption for this talk to action
            t => !(t.transitionType === "talkOption" && t.parentTalkId === id)
          );
          options.forEach((opt, idx) => { //adds one talkOption transition for each option
            updatedTransitions.push({
              id: `${id}_opt${idx}`,
              x: talkTransition.x,
              y: talkTransition.y + TRANSITION_HEIGHT + idx * TRANSITION_HEIGHT, //stack below the og talk transition
              transitionType: "talkOption",
              parentTalkId: id,
              optionIndex: idx,
              name: opt || `Option ${idx + 1}`,
              asset: { dialogueText: opt }
            });
          });
        }

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
          transitions: updatedTransitions,
        };
      }
      return scene;
    });
    setScenes(updatedScenes);

    //updates the selected elements state without resets in properties
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

  const fireToken = (transitionId) => { //fire tokens to connected places
    const transition = currentScene.transitions.find((t) => t.id === transitionId);
    if (!transition) return; //only transitions fire tokens
    if (transition.transitionType === "sensor" && transition.asset?.booleanSensor) {
      return; //boolean sensors are handled by updateBooleanSensors
    }

    // play sound on interaction if configured
    if (transition.asset?.sound?.src && transition.asset?.audioMode === "interact") {
      playSound(transition.asset.sound.src);
    }

    if (mode === "run") {
      if (transition?.asset?.hideAfterUse) { //add to used transitions
        setUsedTransitions(prev => new Set(prev).add(transitionId));
      }
    }
  
    //get the correct input and output places connected to the transition
    const inputPlaces = currentScene.arcs.filter((arc) => arc.to.id === transitionId).map((arc) => arc.from.id);
    const outputPlaces = currentScene.arcs.filter((arc) => arc.from.id === transitionId).map((arc) => arc.to.id);
  
    //check if all input places have at least one token (for or/and logic)
    const allInputsHaveTokens = inputPlaces.every((id) => (currentScene.places.find((p) => p.id === id)?.tokens || 0) >= 1);
    if (!transition.allowPartialFiring && !allInputsHaveTokens) return;
    if (transition.allowPartialFiring && allInputsHaveTokens) return;
  
    const changedNames = {};
  
    const updatedScenes = scenes.map((scene) => //update tokens for input and output places in the current scene
      scene.id === currentSceneId
        ? {
            ...scene,
            places: scene.places.map((p) => {
              // decrease number of tokens in input place
              if (inputPlaces.includes(p.id)) {
                if ((p.placeType === "entry" || p.placeType === "exit") && p.name) {
                  const newTokens = Math.max(p.tokens - 1, 0);
                  changedNames[p.name] = newTokens;
                  return { ...p, tokens: newTokens };
                }
                return { ...p, tokens: Math.max(p.tokens - 1, 0) }; //no negative numbers
              }
              // increase num tokens in output place
              if (outputPlaces.includes(p.id)) {
                if ((p.placeType === "entry" || p.placeType === "exit") && p.name) {
                  const newTokens = p.tokens + 1;
                  changedNames[p.name] = newTokens;
                  return { ...p, tokens: newTokens };
                }
                //if (transition.transitionType === "start") return { ...p, tokens: 1 };
                return { ...p, tokens: p.tokens + 1 };
              }
              return p;
            }),
          }
        : scene
    );
  
    //synchronize num of tokens of all entry/exit places with the same name
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

  const updateBooleanSensors = () => { //set token to connected places to 1 or 0
    //for each sensor in boolean mode
    const updatedScenes = scenes.map(scene => {
      if (scene.id !== currentSceneId) return scene;
      let updatedPlaces = [...scene.places];
      scene.transitions.forEach(t => {
        if (t.transitionType === "start") { // get the character areaSize set in properties
            character.size = t.asset.areaSize;
        } else if (t.transitionType === "sensor" && t.asset?.booleanSensor) {
          //find output places
          const outputPlaces = scene.arcs.filter(arc => arc.from.id === t.id).map(arc => arc.to.id);
          const dx = character.x - t.asset.assetPosition?.x;
          const dy = character.y - t.asset.assetPosition?.y;
          const area = t.asset?.areaSize ?? INTERACT_AREA;
          const inside = Math.sqrt(dx * dx + dy * dy) < (character.size + area);
          updatedPlaces = updatedPlaces.map(p =>
            outputPlaces.includes(p.id)
              ? { ...p, tokens: inside ? 1 : 0 } //set the connected place's tokens to 1 if inside and 0 if outside
              : p
          );
        }
      });
      return { ...scene, places: updatedPlaces };
    });
    setScenes(updatedScenes);
  };
  
  useEffect(() => { //check if start button is defined (has character asset) to run
    const characterSet = currentScene.transitions.find(
      t => t.transitionType === "start" && t.asset?.image?.src
    ) || globalStartAsset;
    setCanEnterRunMode(!!characterSet);
    if (mode !== "run") return;
  }, [mode, currentScene, globalStartAsset]);

  useEffect(() => { //only run when character moves to improve performance
    if (mode === "run") {
      updateBooleanSensors();
    }
  }, [character.x, character.y, character.size, mode]);

  useEffect(() => { //event listener for keys input in run mode
    if (mode !== "run") return;

    const handleKeyDown = (e) => {
      setPressedKeys(prev => ({ ...prev, [e.key]: true })); //set true if key pressed
      
      currentScene.transitions.forEach((t) => {
        //find input place for this transition
        const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
        const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);

        if (t.transitionType === "start" && firstStarted) {
          fireToken(t.id);
          character.size = t.asset.areaSize; //updates it before anything else
          firstStarted = false;
        } /*else if (t.transitionType === "sensor") { //check proximity to set assets
          const dx = character.x - t.asset.assetPosition?.x;
          const dy = character.y - t.asset.assetPosition?.y;
          //console.log(character.x + " , " + character.y + " and " + dx + " , " + dy);
          const area = t.asset?.areaSize ?? INTERACT_AREA;
          
          if (Math.sqrt(dx * dx + dy * dy) < (character.size + area)) { //if area circles intersect
            fireToken(t.id);
          }
        } else if (t.transitionType === "look" && e.key === " " && inputPlace && inputPlace.tokens > 0) { //cant work without input :( for now >:)
          setActiveDialogue({
            type: "look",
            text: t.asset?.dialogueText || "Nothing interesting.",
          });
          fireToken(t.id);
        } else if (t.transitionType === "talk" && e.key === " " && inputPlace && inputPlace.tokens > 0) { //cant work without input :( for now >:)
          setActiveDialogue({
            type: "talk",
            text: t.asset?.dialogueText || "Can't talk right now...",
            options: t.asset?.dialogueOptions || ["..."],
            transitionId: t.id,
          });
          fireToken(t.id);
        } else if (e.key === " ") { //spacebar key
          fireToken(t.id);
        }*/
      });
    };
    const handleKeyUp = (e) => {
      setPressedKeys(prev => ({ ...prev, [e.key]: false })); //set false if key released
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode, character]);

  useEffect(() => { //character controls
    if (mode !== "run") return;

    let animationFrameId;
    const step = 4; //smaller steps for slower movement

    const moveCharacter = () => {
      setCharacter(prev => {
        let { x, y } = prev;
        let size = characterAsset?.assetSize?.width;
        if (pressedKeys["w"] || pressedKeys["W"]) y -= step;
        if (pressedKeys["s"] || pressedKeys["S"]) y += step;
        if (pressedKeys["a"] || pressedKeys["A"]) x -= step;
        if (pressedKeys["d"] || pressedKeys["D"]) x += step;
        
        //logic for the scene transitions
        let newSceneId = currentSceneId;
        let newX = x;
        const margin = 10;

        if (x > window.innerWidth - size / 2 - margin) { //move to the next scene (if it even exists)
          const currentIdx = scenes.findIndex(s => s.id === currentSceneId);
          if (currentIdx < scenes.length - 1) {
            newSceneId = scenes[currentIdx + 1].id;
            newX = size / 2 + margin; //appear at left edge
          } else {
            newX = window.innerWidth - size / 2 - margin; //or straight to a wall
          }
        } else if (x < size / 2 + margin) { //move to the previous scene (if it even exists)
          const currentIdx = scenes.findIndex(s => s.id === currentSceneId);
          if (currentIdx > 0) {
            newSceneId = scenes[currentIdx - 1].id;
            newX = window.innerWidth - size / 2 - margin; //appear at right edge
          } else {
            newX = size / 2 + margin; //or straight to a wall
          }
        }

        if (newSceneId !== currentSceneId) { //update scene and character position
          setCurrentSceneId(newSceneId);
          return { ...prev, x: newX, y, size };
        }

        const newY = Math.max(size / 2, Math.min(window.innerHeight - size / 2, y)); //walls on top and bottom
        return { ...prev, x: newX, y: newY, size };
      });
      animationFrameId = requestAnimationFrame(moveCharacter);
    };

    animationFrameId = requestAnimationFrame(moveCharacter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode, pressedKeys, characterAsset, currentSceneId, scenes]);

  useEffect(() => { //resets the used and available transition assets in run mode
    if (mode === "run") {
    setUsedTransitions(new Set());
    setWasAvailable(new Set());
  }
  }, [mode]);

  useEffect(() => { //for showing the transition image before or after interaction
    if (mode !== "run") return;
    const availableNow = new Set(wasAvailable);
    currentScene.transitions.forEach(t => {
      if (t.asset?.showWhenAvailable) {
        const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
        const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);
        if (inputPlace && inputPlace.tokens > 0) {
          availableNow.add(t.id);
        }
      }
    });
    setWasAvailable(availableNow);
  }, [mode, currentScene, currentScene.places, currentScene.transitions]);

  // Ambient audio: play scene ambience when in run mode
  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current = null;
    }
    if (mode !== "run") return;
    const soundSrc = currentScene?.sound;
    if (soundSrc) {
      ambientAudioRef.current = playSound(soundSrc, { loop: true, volume: 0.6 });
    }
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, [mode, currentSceneId]);
  
  // Pass-through audio: play when character enters an action area (only in run)
  useEffect(() => {
    if (mode !== "run") return;
    const insideNow = new Set();
    currentScene.transitions.forEach(t => {
      if (!t.asset?.assetPosition || t.asset?.audioMode !== "passThrough") return;
      const dx = character.x - (t.asset.assetPosition.x ?? 0);
      const dy = character.y - (t.asset.assetPosition.y ?? 0);
      const area = t.asset.areaSize ?? INTERACT_AREA;
      const inside = Math.sqrt(dx*dx + dy*dy) < (character.size + area);
      if (inside) insideNow.add(t.id);
      const wasInside = passThroughInsideRef.current.has(t.id);
      if (inside && !wasInside) {
        // entered — play once
        if (t.asset?.sound?.src) playSound(t.asset.sound.src);
      }
    });
    passThroughInsideRef.current = insideNow;
  }, [character.x, character.y, character.size, mode, currentSceneId, currentScene.transitions]);
  
  // scene thumbnail context menu handlers (from Topbar)
  const handleSceneContextMenu = (x, y, sceneId) => {
    setSceneContextMenu({ x, y, sceneId });
  };
  const deleteScene = (sceneId) => {
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== sceneId);
      if (filtered.length === 0) return prev;
      if (currentSceneId === sceneId) setCurrentSceneId(filtered[0].id);
      return filtered;
    });
    setSceneContextMenu(null);
  };

  const backgroundImage = useImage(currentScene.background)[0]; //preload the background image so useImage works

  const updateScene = (sceneId, updates) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updates } : s));
    //keep selectedElement in sync if it's the same scene
    if (selectedElement?.type === "scene" && selectedElement.id === sceneId) {
      setSelectedElement(prev => ({
        ...prev,
        name: updates.name ?? prev.name,
        asset: {
          ...prev.asset,
          background: updates.background ?? prev.asset?.background,
          sound: updates.sound ?? prev.asset?.sound,
        }
      }));
    }
  };

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
      onSceneContextMenu={handleSceneContextMenu}
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
                //fill="#fff"
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
                {/*p.placeType === "normal" &&*/ (
                  <>
                  {p.asset?.image && <AssetRenderer x={0} y={-PLACE_RADIUS * 1.5} asset={p.asset} />}
                  <Text x={-PLACE_RADIUS} y={-5} width={PLACE_RADIUS * 2} align="center" text={p.tokens.toString()} fontSize={14} fill="black" />
                  </>
                )}
                {p.placeType === "entry" && (
                  <Circle radius={PLACE_RADIUS/1.4} fill="black" /> //PLACE_RADIUS/3
                )}
                {p.placeType === "exit" && (
                  <>
                  <Line points={[8-PLACE_RADIUS-BORDER_SIZE, 8-PLACE_RADIUS-BORDER_SIZE, PLACE_RADIUS-BORDER_SIZE-4, PLACE_RADIUS-BORDER_SIZE-4]}
                  stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
                  <Line points={[8-PLACE_RADIUS-BORDER_SIZE, PLACE_RADIUS-BORDER_SIZE-4, PLACE_RADIUS-BORDER_SIZE-4, 8-PLACE_RADIUS-BORDER_SIZE]}
                  stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
                  </>
                )}
                {/*<Text x={-PLACE_RADIUS} y={-5} width={PLACE_RADIUS * 2} align="center" text={p.tokens.toString()} fontSize={14} fill="black" />*/}
                <Text x={-PLACE_RADIUS*2} y={25} width={PLACE_RADIUS * 4} align="center" text={p.name} fontSize={14} fill="black" />
              </Group>
              ))}
              {/* Render Transitions */}
              {currentScene.transitions.map((t) => {
                const groupProps = { //allows for conditionals in the properties woo
                  key: t.id,
                  x: t.x,
                  y: t.y,
                  draggable: t.transitionType !== "talkOption", //conditional draggable for talkOPtion transitions
                  onClick: () => handleElementClick(t.id, "transition"),
                  onContextMenu: (e) => handleContextMenu(e, t.id, "transition"),
                  onDragMove: (e) => handleDragMove(e, t.id, "transition"), // Only used if draggable
                };

                return (
                  <Group {...groupProps}
                    /*key={t.id}
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
                    /*onContextMenu={(e) => handleContextMenu(e, t.id, "transition")}*/
                  >
                    {t.asset?.image && <AssetRenderer x={0} y={-TRANSITION_HEIGHT*0.8} asset={t.asset} />}
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
                      x={-TRANSITION_WIDTH*0.4}
                      y={-8}
                      width={TRANSITION_WIDTH*0.8}
                      height={TRANSITION_HEIGHT}
                      align="center"
                      justify="center"
                      text={t.name}
                      fontSize={14}
                      fill="black"
                    />
                  </Group>
                );
              })} 
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
      {/* Small Preview */}
      <div className="scene-background-preview">
        <SceneStage
          width={300}
          height={300/(window.innerWidth/window.innerHeight)}
          //height={300/((backgroundImage.width/backgroundImage.height) ?? (window.innerWidth/window.innerHeight))}
          maxHeight={250}
          backgroundImage={backgroundImage}
          currentScene={currentScene}
          character={character}
          characterAsset={characterAsset}
          showSensors={true}
          scale={300 / window.innerWidth}
          usedTransitions={usedTransitions}
          wasAvailable={wasAvailable}
        />
      </div>
      {/* Run mode Scene */}
      {mode === "run" && !debug && (
        <div className="scene-background">
          <SceneStage
            width={window.innerWidth}
            height={window.innerHeight}
            backgroundImage={backgroundImage}
            currentScene={currentScene}
            character={character}
            characterAsset={characterAsset}
            showSensors={false}
            className="main-stage"
            scale={1}
            usedTransitions={usedTransitions}
            wasAvailable={wasAvailable}
          />
        </div>
      )}
      {/*<Properties />*/}
      <Properties
        selectedElement={selectedElement} updateElementAsset={updateElementAsset}
        availableImages={allAvailableImages} availableSounds={allAvailableSounds}
        availableBackgrounds={allAvailableBackgrounds} updateScene={updateScene}
        selectedTool={selectedTool} setSelectedTool={setSelectedTool}/>
      </div>
      {/* Background Selector */}
      {showBackgroundSelector && (
        <div className="background-selector-overlay">
          <div className="background-selector">
            <h3>Select a background for the new scene</h3>
            <div className="background-selector-ele">
              {allAvailableBackgrounds.map((bg, idx) => (
                <img className="background-selector-list"
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
      
      {/* Interactive Buttons */}
      {mode === "run" && (
        <div>
          {currentScene.transitions
            .filter(t =>
              //["sensor", "interact", "talk", "look"].includes(t.transitionType) &&
              t.asset?.assetPosition &&
              t.asset?.areaSize)
            .filter(t => {
              if (t.asset?.hideAfterUse && usedTransitions.has(t.id)) return false;
              if (t.asset?.showWhenAvailable) {
                //only show if can be fired
                const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
                const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);
                return (inputPlace && inputPlace.tokens > 0) || wasAvailable.has(t.id);
              }
              return true;
            })
            .map((t, idx) => {
              //find input place and check if it has tokens
              const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
              const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);
              if (!inputPlace || inputPlace.tokens <= 0) return null;
            
              //check if character is within area
              const dx = character.x - t.asset.assetPosition.x;
              const dy = character.y - t.asset.assetPosition.y;
              const area = t.asset.areaSize ?? 70;
              if (Math.sqrt(dx * dx + dy * dy) > (character.size + area)) return null;
            
              //draw button at actions position
              const left = t.asset.assetPosition.x;
              const top = t.asset.assetPosition.y;
            
              return (
                <button className="interact-button"
                  key={t.id}
                  style={{
                    left: left - TRANSITION_WIDTH/2,
                    top: top - TRANSITION_HEIGHT/2,
                  }}
                  onClick={() => {
                    if (t.transitionType === "look") {
                      setActiveDialogue({
                        type: "look",
                        text: t.asset?.dialogueText || "Nothing interesting.",
                      });
                      fireToken(t.id);
                    } else if (t.transitionType === "talk") {
                      setActiveDialogue({
                        type: "talk",
                        text: t.asset?.dialogueText || "Can't talk right now...",
                        options: t.asset?.dialogueOptions || ["..."],
                        transitionId: t.id,
                      });
                      fireToken(t.id);
                    } else {
                      fireToken(t.id);
                    }
                  }}
                >
                  {t.name}
                </button>
              );
            })}
        </div>
      )}
      {/* Inventory slots */}
      {mode === "run" && (
        <div className="inventory-slots">
          {Array.from({ length: Math.max(5, inventoryItems.length) }).map((_, idx) => ( //sets number of slots to 5 or more
            <div key={idx} className="inventory-assets">
              {inventoryItems[idx] && (
                <span title={inventoryItems[idx]?.name || "item"}>
                  <img
                    src={inventoryItems[idx].image.src}
                    alt={inventoryItems[idx].name}
                    style={{ maxWidth: 48, maxHeight: 48 }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Dialogue */}
      {mode === "run" && activeDialogue && (
        <div className="dialoguebox">
          <div style={{ marginBottom: 12 }}>{activeDialogue.text}</div>
          {activeDialogue.type === "talk" && (
            <div>
              {activeDialogue.options.map((opt, idx) => (
                <button
                  key={idx} className="dialoguebox-option"
                  onClick={() => {
                    const talkOptionTransition = currentScene.transitions.find( //find the corresponding option to fire a token
                      t => t.transitionType === "talkOption" &&
                        t.parentTalkId === activeDialogue.transitionId &&
                        t.optionIndex === idx
                    );
                    if (talkOptionTransition) {
                      fireToken(talkOptionTransition.id); //fire token from the choosen dialogue option
                    }
                    setActiveDialogue(null);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setActiveDialogue(null)}>Close</button>
        </div>
      )}

      {/* Elements menu */}
      {contextMenu && (
        <div className="context" style={{top: contextMenu.y, left: contextMenu.x}}>
          {contextMenu.type === "transition" && (
            <>
            <button onClick={fireElement}>Fire token</button>
            <button onClick={resetElement}>Reset properties</button>
            </>
          )}
          {contextMenu.type === "place" && (
            <button onClick={resetElement}>Reset tokens</button>
          )}
          <button onClick={deleteElement}>Delete element</button>
        </div>
      )}
      {/* Scenes menu */}
      {sceneContextMenu && (
        <div className="context" style={{ top: sceneContextMenu.y, left: sceneContextMenu.x }}>
          <button onClick={() => deleteScene(sceneContextMenu.sceneId)}>Delete scene</button>
          <button onClick={() => setSceneContextMenu(null)}>Cancel</button>
        </div>
      )}
      
      {mode==="overview" && (
        <div>
        <SceneOverview
          scenes={scenes} setScenes={setScenes}
          setSelectedElement={setSelectedElement} setCurrentSceneId={setCurrentSceneId}
          //onClick={handleStageClick}
        />
      </div>
      )}
    </div>
  );
};

export default App;