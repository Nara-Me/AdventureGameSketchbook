import React, { useState } from "react";
import { Stage, Layer, Circle, Rect, Arrow, Text, Group } from "react-konva";

import Topbar from "./components/Topbar.js";
//import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";

const App = () => {
  const BORDER_SIZE = 2;
  const PLACE_RADIUS = 20;
  const TRANSITION_WIDTH = 100;
  const TRANSITION_HEIGHT = 40;

  const [places, setPlaces] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [arcs, setArcs] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null); // none, places, transitions, arrows
  const [mode, setMode] = useState("edit"); // Modes: "edit", "run"
  const [contextMenu, setContextMenu] = useState(null); // delete and
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [nextPlaceId, setNextPlaceId] = useState(1);
  const [nextTransitionId, setNextTransitionId] = useState(1);

  const isOverlapping = (x, y) => {
    return (
      places.some((p) => Math.hypot(p.x - x, p.y - y) < PLACE_RADIUS+10) ||
      transitions.some((t) => Math.abs(t.x - x) < TRANSITION_WIDTH / 2 && Math.abs(t.y - y) < TRANSITION_HEIGHT / 2)
    );
  };

  const calculateArrowPoints = (from, to) => {
    const fromElement = places.find((p) => p.id === from.id) || transitions.find((t) => t.id === from.id);
    const toElement = places.find((p) => p.id === to.id) || transitions.find((t) => t.id === to.id);
    if (!fromElement || !toElement) return [];

    let { x: x1, y: y1 } = fromElement;
    let { x: x2, y: y2 } = toElement;

    const angle = Math.atan2(y2 - y1, x2 - x1);

    if (from.type === "place") {
      x1 += PLACE_RADIUS * Math.cos(angle);
      y1 += PLACE_RADIUS * Math.sin(angle);
    } else if (from.type === "transition") {
      x1 += (TRANSITION_WIDTH / 2) + (TRANSITION_WIDTH / 2) * Math.cos(angle);
      y1 += (TRANSITION_HEIGHT / 2) + (TRANSITION_HEIGHT / 2) * Math.sin(angle);
    }

    if (to.type === "place") {
      x2 -= PLACE_RADIUS * Math.cos(angle);
      y2 -= PLACE_RADIUS * Math.sin(angle);
    } else if (to.type === "transition") {
      x2 -= (-TRANSITION_WIDTH / 2) + (TRANSITION_WIDTH / 2) * Math.cos(angle);
      y2 -= (-TRANSITION_HEIGHT / 2) + (TRANSITION_HEIGHT / 2) * Math.sin(angle);
    }

    return [x1, y1, x2, y2];
  };

  const handleStageClick = (e) => {
    setContextMenu(null);
    if (e.evt.button !== 0 || mode !== "edit") return;
    
    const { x, y } = e.target.getStage().getPointerPosition();
    if (isOverlapping(x, y)) return;
    //else console.log("cancelled");//setConnectingFrom(null);

    if (selectedTool === "place") {
      setPlaces([...places, { id: `p${nextPlaceId}`, x, y, tokens: 0 }]);
      setNextPlaceId(nextPlaceId + 1);
    } else if (selectedTool === "transition") {
      setTransitions([...transitions, { id: `t${nextTransitionId}`, x, y }]);
      setNextTransitionId(nextTransitionId + 1);
    /*} else if (selectedTool === "arc") { //for removing arrows
      console.log("cancelled");
      setConnectingFrom(null);*/
    }
  };

  const handleElementClick = (id, type) => {
    if (mode === "run" && type === "transition") {
      fireTransition(id);
      return;
    }

    if (selectedTool !== "arc") {
      setConnectingFrom(null);
      console.log("NO");
      return;
    }
    
    if (!connectingFrom) { //working spaguetti
      setConnectingFrom({ id, type });
    } else if (connectingFrom.id !== id && connectingFrom.type !== type) {
      console.log("connected");
      setArcs([...arcs, { from: connectingFrom, to: { id, type } }]);
      setConnectingFrom(null);
    } else if (connectingFrom.id === id || connectingFrom.type === type) {
      setConnectingFrom(null);
      setConnectingFrom({ id, type });
      console.log("connection restarted");
      return;
    } else {  //just in case
      console.log("connection cancelled");
      setConnectingFrom(null);
    }
  };

  const handleDragMove = (e, id, type) => {
    const { x, y } = e.target.position();
    if (type === "place") {
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
    }
  };

  const handleContextMenu = (e, id, type) => {
    setConnectingFrom(null);
    e.evt.preventDefault();
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, id, type });
  };

  const deleteElement = () => {
    setConnectingFrom(null);
    if (!contextMenu) return;
    const { id, type } = contextMenu;
    if (type === "arc") {
      setArcs(arcs.filter((_, index) => index !== id));
    } else {
      //console.log(id);
      setPlaces(places.filter((p) => p.id !== id));
      setTransitions(transitions.filter((t) => t.id !== id));
      setArcs(arcs.filter((arc) => arc.from.id !== id && arc.to.id !== id));
    }
    setContextMenu(null);
  };

  const fireTransition = (transitionId) => {
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
  };

  return (
    <div>
      <Topbar />
      <button onClick={() => setMode(mode === "edit" ? "run" : "edit")}>
        {mode === "edit" ? "Switch to Run Mode" : "Switch to Edit Mode"}
      </button>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <div
          style={{ width: 40, height: 40, borderRadius: "50%", background: selectedTool === "place" ? "gray" : "white", border: "2px solid black", cursor: "pointer" }}
          onClick={() => setSelectedTool(selectedTool === "place" ? null : "place")}
        ></div>
        <div
          style={{ width: 40, height: 40, background: selectedTool === "transition" ? "gray" : "white", border: "2px solid black", cursor: "pointer" }}
          onClick={() => setSelectedTool(selectedTool === "transition" ? null : "transition")}
        ></div>
        <div
          style={{ width: 40, height: 20, background: selectedTool === "arc" ? "gray" : "white", border: "2px solid black", cursor: "pointer" }}
          onClick={() => setSelectedTool(selectedTool === "arc" ? null : "arc")}
        ></div>
        
      </div>

      {/*<Toolbar />*/}
      <div className="container">
      <Stage className="canvas" width={800} height={600} onClick={handleStageClick}>
        <Layer>
          {places.map((p) => (
            <>
            <Circle
              key={p.id}
              x={p.x}
              y={p.y}
              radius={PLACE_RADIUS}
              fill="white" stroke="black" strokeWidth={BORDER_SIZE}
              draggable//={selectedTool !== "arc"}
              onClick={() => handleElementClick(p.id, "place")}
              onDragMove={(e) => handleDragMove(e, p.id, "place")}
              onContextMenu={(e) => handleContextMenu(e, p.id, "place")}
            />
            <Text /*key={null}*/ x={p.x - 5} y={p.y - 5} text={p.tokens.toString()} fontSize={14} fill="black" />
            </>
          ))}
          {transitions.map((t) => (
            <>
            <Rect
              key={t.id}
              //x={t.x - (TRANSITION_WIDTH/2)} //STOP JITTERING AAAAAA
              //y={t.y - (TRANSITION_HEIGHT/2)}
              x={t.x}
              y={t.y}
              width={TRANSITION_WIDTH} height={TRANSITION_HEIGHT}
              fill="white" stroke="black" strokeWidth={BORDER_SIZE}
              //lineCap="round"
              cornerRadius={5}
              draggable//={selectedTool !== "arc"}
              onClick={() => handleElementClick(t.id, "transition")}
              onDragMove={(e) => handleDragMove(e, t.id, "transition")}
              onContextMenu={(e) => handleContextMenu(e, t.id, "transition")}
            />
            <Text /*key={null}*/ x={t.x + (TRANSITION_WIDTH/2)} y={t.y + (TRANSITION_HEIGHT/2)-5} text={"Action"} fontSize={14} fill="black" />
            </>
          ))}
          {arcs.map((arc, index) => (
            <Arrow
              key={index}
              points={calculateArrowPoints(arc.from, arc.to)}
              stroke="black"
              fill="white"
              //lineCap="round"
              lineJoin="round"
              strokeWidth={BORDER_SIZE}
              onContextMenu={(e) => handleContextMenu(e, index, "arc")}
            />
          ))}
        </Layer>
      </Stage>
      <Properties />
      </div>
      {contextMenu && (
        <div
          style={{ position: "absolute", top: contextMenu.y, left: contextMenu.x, background: "white", padding: "5px", border: "1px solid black" }}
        >
          <button onClick={deleteElement}>Delete</button>
        </div>
      )}
    </div>
  );
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

/*import React, { useState } from "react";
import usePetriNet from "./components/PetriNet.js";

const App = () => {
  const { places, transitions, arcs, addPlace, addTransition, addArc } = usePetriNet();
  const [connecting, setConnecting] = useState(null);

  const CanvasClick = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    if (e.shiftKey) {
      addTransition(offsetX, offsetY);
    } else {
      addPlace(offsetX, offsetY);
    }
  };

  const startConnection = (id) => {
    setConnecting(id);
  };

  const completeConnection = (id) => {
    if (connecting && id !== connecting) {
      addArc(connecting, id);
      setConnecting(null);
    }
  };

  return (
    <svg width="100vw" height="100vh" onClick={CanvasClick}>
      {arcs.map((arc, index) => {
        const from = [...places, ...transitions].find((el) => el.id === arc.from);
        const to = [...places, ...transitions].find((el) => el.id === arc.to);
        return from && to ? (
          <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="black" strokeWidth="2" />
        ) : null;
      })}

      {places.map((place) => (
        <circle key={place.id} cx={place.x} cy={place.y} r="20" fill="white" stroke="black"
          onClick={(e) => { e.stopPropagation(); startConnection(place.id); }}
          onContextMenu={(e) => { e.preventDefault(); completeConnection(place.id); }} />
      ))}

      {transitions.map((transition) => (
        <rect key={transition.id} x={transition.x - 10} y={transition.y - 20} width="20" height="40" fill="black"
          onClick={(e) => { e.stopPropagation(); startConnection(transition.id); }}
          onContextMenu={(e) => { e.preventDefault(); completeConnection(transition.id); }} />
      ))}
    </svg>
  );
};

export default App;*/