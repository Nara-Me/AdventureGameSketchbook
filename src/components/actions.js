// actions.js
export const handleWheel = (stageRef, e) => {
    e.evt.preventDefault();
  
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
  
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
  
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
  
  export const handleStageClick = (e, selectedTool, places, setPlaces, transitions, setTransitions, isOverlapping, nextPlaceId, setNextPlaceId, nextTransitionId, setNextTransitionId, mode) => {
    if (e.evt.button !== 0 || mode !== "edit") return;
  
    const { x, y } = e.target.getStage().getPointerPosition();
    if (isOverlapping(x, y)) return;
  
    if (selectedTool === "place") {
      setPlaces([...places, { id: `p${nextPlaceId}`, x, y, tokens: 0 }]);
      setNextPlaceId(nextPlaceId + 1);
    } else if (selectedTool === "transition") {
      setTransitions([...transitions, { id: `t${nextTransitionId}`, x, y }]);
      setNextTransitionId(nextTransitionId + 1);
    }
  };
  