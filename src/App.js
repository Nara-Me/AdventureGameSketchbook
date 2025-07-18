import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Image, Group, Line } from "react-konva";
import useImage from "use-image";

import Topbar from "./components/Topbar.js";
import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";
import SceneStage from "./components/SceneStage";

const WORKSPACE_SIZE = 5000;

const GAP_SIZE = 7; //7
const BORDER_SIZE = 2;
const PLACE_RADIUS = 20; //20
const TRANSITION_WIDTH = 100;
const TRANSITION_HEIGHT = 40;
const INTERACT_AREA = 100;
const debug = false; //true to show edit mode when "running"

let canEnterRunMode = false;

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
  const [selectedTool, setSelectedTool] = useState(null); // none, places, transitions, arrows, entry and exit points
  const [contextMenu, setContextMenu] = useState(null); // delete and TBA
  const [connectingFrom, setConnectingFrom] = useState(null); //
  const [nextPlaceId, setNextPlaceId] = useState(1);
  const [nextTransitionId, setNextTransitionId] = useState(1);

  // asset library const
  const [userImages, setUserImages] = useState([]); //images from user in asset library
  const [userAudios, setUserAudios] = useState([]); //audios from user in asset library
  const [userBackgrounds, setUserBackgrounds] = useState([]); //backgrounds from user in asset library
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  // character and interaction const idk
  const [globalStartTransition, setGlobalStartTransition] = useState(null); //global set up for character
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

  /*const canEnterRunMode = !!currentScene.transitions.find(
    t => t.transitionType === "start" //&& t.asset?.image?.src
  );*/
  //let characterAsset;

  const startTransition = currentScene.transitions.find(
    t => t.transitionType === "start" && t.asset?.image?.src
  );
  const characterAsset = startTransition?.asset;

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
        if (mode === "edit" && !canEnterRunMode) { //popup window
          alert("You must place and set up a Start transition (with a character asset) before running!");
          return;
        }
        setMode((prev) => (prev === "edit" ? "run" : "edit"));
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
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

  const inventoryItems = currentScene.places //set place asset as an item for the inventory
  .filter(p => p.asset?.image && (p.tokens ?? 0) > 0)
  .map(p => ({
    id: p.id,
    image: p.asset.image,
    name: p.name || "", //none have set names (for)
  }));

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
    } else if (selectedTool === "transition" || (selectedTool === "start" /*&& !globalStartTransition*/) || selectedTool === "sensor" || selectedTool === "talk" || selectedTool === "look" || selectedTool === "interact") { //sets the transmitions for the scene
      const transitionType = selectedTool;// === "transition" ? "sensor" : selectedTool;
      /*const defaultAsset = {};
      if (transitionType === "sensor" || transitionType === "start") {
        defaultAsset.showArea = true;
        if (transitionType === "sensor") defaultAsset.booleanSensor = true;
      }*/
      const updatedScenes = scenes.map((scene) =>
        scene.id === currentSceneId
          ? {
              ...scene,
              transitions: [...scene.transitions, { id: `t${nextTransitionId}`, x, y, transitionType, name: transitionType.charAt(0).toUpperCase() + transitionType.slice(1), /*asset: defaultAsset, */}], //Name is setup automatically for transitions
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

  const fireToken = (transitionId) => { //fire tokens to connected places
    const transition = currentScene.transitions.find((t) => t.id === transitionId);
    if (!transition) return; //only transitions fire tokens
    if (transition.transitionType === "sensor" && transition.asset?.booleanSensor) {
      return; //boolean sensors are handled by updateBooleanSensors
    }

    /*if (transition.transitionType === "look") {
      setActiveDialogue({
        type: "look",
        text: transition.asset?.dialogueText || "Nothing interesting.",
      });
    } else if (transition.transitionType === "talk") {
      setActiveDialogue({
        type: "talk",
        options: transition.asset?.dialogueOptions || ["..."],
      });
    }*/
  
    //get the correct input and output places connected to the transition
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
                if (transition.transitionType === "start") return { ...p, tokens: 1 };
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
  
  useEffect(() => {
    canEnterRunMode = currentScene.transitions.find( //check if start button is defined (has character asset)
      t => t.transitionType === "start" && t.asset?.image?.src
    );
    if (mode !== "run") return;
  }, [mode, currentScene]);

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

        if (t.transitionType === "start") {
          fireToken(t.id);
          character.size = t.asset.areaSize; //updates it before anything else
        } else if (t.transitionType === "sensor") { //check proximity to set assets
          const dx = character.x - t.asset.assetPosition?.x;
          const dy = character.y - t.asset.assetPosition?.y;
          //console.log(character.x + " , " + character.y + " and " + dx + " , " + dy);
          const area = t.asset?.areaSize ?? INTERACT_AREA;
          
          if (Math.sqrt(dx * dx + dy * dy) < (character.size + area)) { //if area circles intersect
            fireToken(t.id);
          }
        } else if (t.transitionType === "look" && e.key === " " && inputPlace && inputPlace.tokens > 0) {
          setActiveDialogue({
            type: "look",
            text: t.asset?.dialogueText || "Nothing interesting.",
          });
          fireToken(t.id);
        } else if (t.transitionType === "talk" && e.key === " " && inputPlace && inputPlace.tokens > 0) {
          setActiveDialogue({
            type: "talk",
            text: t.asset?.dialogueText || "Can't talk right now...",
            options: t.asset?.dialogueOptions || ["..."],
          });
          fireToken(t.id);
        } else if (e.key === " ") { //spacebar key
            fireToken(t.id);
        }
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
  }, [mode]);

  useEffect(() => {
    if (mode !== "run") return;

    let animationFrameId;
    const step = 4; //smaller steps for slower movement

    const moveCharacter = () => {
      setCharacter(prev => {
        let { x, y } = prev;
        let size = characterAsset?.assetSize?.width;
        if (pressedKeys["w"] /*|| pressedKeys["ArrowUp"]*/) y -= step;
        if (pressedKeys["s"] /*|| pressedKeys["ArrowDown"]*/) y += step;
        if (pressedKeys["a"] /*|| pressedKeys["ArrowLeft"]*/) x -= step;
        if (pressedKeys["d"] /*|| pressedKeys["ArrowRight"]*/) x += step;
        return { ...prev, x, y, size };
      });
      animationFrameId = requestAnimationFrame(moveCharacter);
    };

    animationFrameId = requestAnimationFrame(moveCharacter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode, pressedKeys, characterAsset]);

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
                  {p.asset?.image && <AssetRenderer x={0} y={-PLACE_RADIUS * 1.5} asset={p.asset} />}
                  <Text x={-PLACE_RADIUS} y={-5} width={PLACE_RADIUS * 2} align="center" text={p.tokens.toString()} fontSize={14} fill="black" />
                  </>
                )}
                {p.placeType === "entry" && (
                  <Circle radius={PLACE_RADIUS/3} fill="black" />
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
      {/* Small Preview */}
      <div className="scene-background-preview">
        <SceneStage
          width={300}
          height={300/(window.innerWidth/window.innerHeight)}
          backgroundImage={backgroundImage}
          currentScene={currentScene}
          character={character}
          characterAsset={characterAsset}
          showSensors={true}
          scale={300 / window.innerWidth}
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
          />
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
                    /*const talkOptionTransition = currentScene.transitions.find( //find the corresponding option to fire a token
                      t => t.transitionType === "talkOption" &&
                        t.parentTalkId === activeDialogue.transitionId &&
                        t.optionIndex === idx
                    );
                    if (talkOptionTransition) {
                      fireToken(talkOptionTransition.id);
                    }*/
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
      {contextMenu && (
        <div className="context" style={{top: contextMenu.y, left: contextMenu.x}}>
          <button onClick={deleteElement}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default App;