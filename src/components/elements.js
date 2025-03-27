// elements.js
import React from "react";
import { Circle, Rect, Text, Arrow } from "react-konva";

export const PlaceElement = ({ p, handleElementClick, handleDragMove, handleContextMenu, PLACE_RADIUS, BORDER_SIZE }) => (
  <>
    <Circle
      key={p.id}
      x={p.x} y={p.y}
      radius={PLACE_RADIUS}
      fill="white" stroke="black" strokeWidth={BORDER_SIZE}
      draggable
      onClick={() => handleElementClick(p.id, "place")}
      onDragMove={(e) => handleDragMove(e, p.id, "place")}
      onContextMenu={(e) => handleContextMenu(e, p.id, "place")}
    />
    <Text x={p.x - 5} y={p.y - 5} text={p.tokens.toString()} fontSize={14} fill="black" />
  </>
);

export const TransitionElement = ({ t, handleElementClick, handleDragMove, handleContextMenu, TRANSITION_WIDTH, TRANSITION_HEIGHT, BORDER_SIZE }) => (
  <>
    <Rect
      key={t.id}
      x={t.x} y={t.y}
      width={TRANSITION_WIDTH} height={TRANSITION_HEIGHT}
      fill="white" stroke="black" strokeWidth={BORDER_SIZE}
      cornerRadius={5}
      draggable
      onClick={() => handleElementClick(t.id, "transition")}
      onDragMove={(e) => handleDragMove(e, t.id, "transition")}
      onContextMenu={(e) => handleContextMenu(e, t.id, "transition")}
    />
    <Text x={t.x + (TRANSITION_WIDTH / 4)} y={t.y + (TRANSITION_HEIGHT / 2) - 5} text={"Action"} fontSize={14} fill="black" />
  </>
);

export const ArcElement = ({ arc, calculateArrowPoints, BORDER_SIZE }) => (
  <Arrow
    key={arc.from.id + arc.to.id}
    points={calculateArrowPoints(arc.from, arc.to)}
    stroke="black" fill="white"
    lineCap="round" lineJoin="round"
    pointerLength={12} pointerWidth={15}
    strokeWidth={BORDER_SIZE}
    hitStrokeWidth={BORDER_SIZE + 8}
  />
);
