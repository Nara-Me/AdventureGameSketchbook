// utils.js
export const isOverlapping = (places, transitions, x, y, PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT) => {
    return (
      places.some((p) => Math.hypot(p.x - x, p.y - y) < PLACE_RADIUS + 10) ||
      transitions.some(
        (t) => Math.abs(t.x - x) < TRANSITION_WIDTH / 2 && Math.abs(t.y - y) < TRANSITION_HEIGHT / 2
      )
    );
  };
  
  export const calculateArrowPoints = (places, transitions, from, to, GAP_SIZE, PLACE_RADIUS, TRANSITION_WIDTH, TRANSITION_HEIGHT) => {
    const fromElement = places.find((p) => p.id === from.id) || transitions.find((t) => t.id === from.id);
    const toElement = places.find((p) => p.id === to.id) || transitions.find((t) => t.id === to.id);
    if (!fromElement || !toElement) return [];
  
    let { x: x1, y: y1 } = fromElement;
    let { x: x2, y: y2 } = toElement;
  
    const angle = Math.atan2(y2 - y1, x2 - x1);
  
    if (from.type === "place") {
      x1 += (GAP_SIZE + PLACE_RADIUS) * Math.cos(angle);
      y1 += (GAP_SIZE + PLACE_RADIUS) * Math.sin(angle);
    } else if (from.type === "transition") {
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