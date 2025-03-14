import React, { useState } from "react";
import usePetriNet from "./components/PetriNet.js";
import Topbar from "./components/Topbar.js";
import Toolbar from "./components/Toolbar.js";
import Properties from "./components/Propertybar.js";

const App = () => {
  const BORDER_SIZE = 2;
  const PLACE_RADIUS = 20;
  const TRANSITION_WIDTH = 80;
  const TRANSITION_HEIGHT = 40;

  const { places, transitions, arcs, addPlace, addTransition, startConnection, completeConnection, mode, connectingFrom } = usePetriNet();
  const [mousePos, setMousePos] = useState(null);

  const CanvasClick = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (mode === "place") addPlace(offsetX, offsetY);
    if (mode === "transition") addTransition(offsetX, offsetY);
  };

  /*const handleMouseMove = (e) => {
    if (connectingFrom) {
      setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }
  }*/

  const [draggingArc, setDraggingArc] = useState(null);

  const handleMouseDown = (id) => {
    if (mode === "arc") {
      setDraggingArc(id); //start dragging from this element
    }
  };

  const handleMouseUp = (id) => {
    if (mode === "arc" && draggingArc) {
      completeConnection(id); //complete connection if released on another element
    }
    setDraggingArc(null); //stop dragging in any case
  };

  const handleMouseMove = (e) => {
    if (draggingArc || connectingFrom) {
      setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }
  };

  /*const handleMouseMove = (e) => {
    if (connectingFrom) {
        setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    } else {
        setMousePos(null); // Hide the temp arc when no connection active
    }};    
  };*/

  const calculateEdgePoint = (from, to) => { //properly connect elements
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;
  
    let fromOffsetX = 0, fromOffsetY = 0, toOffsetX = 0, toOffsetY = 0;
  
    if (from.type === "place") {
      fromOffsetX = PLACE_RADIUS * ux;
      fromOffsetY = PLACE_RADIUS * uy;
    } else {
      fromOffsetX = (TRANSITION_WIDTH / 2) * (dx > 0 ? 1 : -1);
      fromOffsetY = (TRANSITION_HEIGHT / 2) * (dy > 0 ? 1 : -1);
    }
  
    if (to.type === "place") {
      toOffsetX = PLACE_RADIUS * ux;
      toOffsetY = PLACE_RADIUS * uy;
    } else {
      toOffsetX = (TRANSITION_WIDTH / 2) * (dx > 0 ? -1 : 1);
      toOffsetY = (TRANSITION_HEIGHT / 2) * (dy > 0 ? -1 : 1);
    }
  
    return {
      x1: from.x + fromOffsetX,
      y1: from.y + fromOffsetY,
      x2: to.x + toOffsetX,
      y2: to.y + toOffsetY,
    };
  };  

  return (
    <div>
      <Topbar />
      <div class="container">
        <Toolbar />
        <svg class="canvas" onClick={CanvasClick} onMouseMove={handleMouseMove}>
          {/* Arrowhead */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
            </marker>
          </defs>

          {/* Arcs (with arrow) */}
          {arcs.map((arc, index) => {
            const from = [...places, ...transitions].find((el) => el.id === arc.from);
            const to = [...places, ...transitions].find((el) => el.id === arc.to);

            if (!from || !to) return null;

            //vector direction
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            //normalize vector
            const ux = dx / length;
            const uy = dy / length;

            //
            const fromRadius = from.id.startsWith("P") ? PLACE_RADIUS : TRANSITION_WIDTH/2;
            const toRadius = to.id.startsWith("P") ? PLACE_RADIUS : TRANSITION_WIDTH/2;

            //adjust start and end points
            const x1 = from.x + ux * fromRadius;
            const y1 = from.y + uy * fromRadius;
            const x2 = to.x - ux * toRadius;
            const y2 = to.y - uy * toRadius;

            return (
              <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={BORDER_SIZE} markerEnd="url(#arrow)" // Arrowhead always visible
              />
            );
          })}

          {/* Temporary arc preview while connecting */}
          {/*connectingFrom && mousePos && (
            <line x1={places.find((p) => p.id === connectingFrom)?.x || transitions.find((t) => t.id === connectingFrom)?.x}
                  y1={places.find((p) => p.id === connectingFrom)?.y || transitions.find((t) => t.id === connectingFrom)?.y}
                  x2={mousePos.x} y2={mousePos.y}*/
          draggingArc && mousePos && (
            <line x1={places.find((p) => p.id === draggingArc)?.x || transitions.find((t) => t.id === draggingArc)?.x}
                  y1={places.find((p) => p.id === draggingArc)?.y || transitions.find((t) => t.id === draggingArc)?.y}
                  x2={mousePos.x} y2={mousePos.y}
                  stroke="gray" strokeWidth={BORDER_SIZE} strokeDasharray="5,5" />
          )}

          {/* Places */}
          {places.map((place) => (
            <circle key={place.id} cx={place.x} cy={place.y} r={PLACE_RADIUS} fill="white" stroke="black" strokeWidth={BORDER_SIZE}
           /* onClick={(e) => {
              e.stopPropagation();
              if (mode === "arc") {
                if (connectingFrom) {
                  completeConnection(place.id);
                  setMousePos(null); // Clears the preview line
                } else {
                  startConnection(place.id);
                }
              }
            }}  */
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(place.id); }}
            onMouseUp={(e) => { e.stopPropagation(); handleMouseUp(place.id); }}
          />
          ))}

          {/* Transitions */}
          {transitions.map((transition) => (
            <rect key={transition.id} x={transition.x - TRANSITION_WIDTH/2} y={transition.y - TRANSITION_HEIGHT/2}
            width={TRANSITION_WIDTH} height={TRANSITION_HEIGHT} fill="white" stroke="black" strokeWidth={BORDER_SIZE}
            /*onClick={(e) => {
              e.stopPropagation();
              if (mode === "arc") {
                if (connectingFrom) {
                  completeConnection(transition.id);
                  setMousePos(null); // Clears the preview line
                } else {
                  startConnection(transition.id);
                }
              }
            }}*/
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(transition.id); }}
              onMouseUp={(e) => { e.stopPropagation(); handleMouseUp(transition.id); }}/>
          ))}
        </svg>
        <Properties />
      </div>
    </div>
  );
};

export default App;


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