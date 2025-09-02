//fix the arrow points and add the places
//re add the comments in the property bar

import React, { useEffect } from "react";
import { Stage, Layer, Group, Text, Arrow, Rect } from "react-konva";
import LoadImage from "./LoadImage";

/**
 * SceneOverview
 * - Full-screen stage showing all scenes as draggable thumbnails
 * - Draws arrows between scenes when an exit place name matches an entry place name
 * - Clicking a scene selects it (Properties panel will edit the scene)
 *
 * Props:
 *  - scenes, setScenes
 *  - setSelectedElement (to allow Properties to edit a "scene" object)
 *  - setCurrentSceneId (optional; double-click could open scene)
 *  - width, height (optional)
 */

const w = 200; //360
const h = 110; //200

const SceneOverview = ({
  scenes, setScenes, setSelectedElement, setCurrentSceneId,
  width = window.innerWidth, height = window.innerHeight,
}) => {
  // ensure scenes have x,y for layout
  useEffect(() => {
    let needUpdate = false;
    const updated = scenes.map((s, idx) => {
      if (typeof s._ovx === "number" && typeof s._ovy === "number") return s;
      needUpdate = true;
      const cols = Math.ceil(Math.sqrt(scenes.length));
      const thumbW = w;
      const thumbH = h;
      const margin = 40;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return { ...s, _ovx: margin + col * (thumbW + margin), _ovy: margin + row * (thumbH + margin) };
    });
    if (needUpdate) setScenes(updated);
  }, [scenes, setScenes]);

  const handleDragMove = (id, e) => {
    const { x, y } = e.target.position();
    setScenes(prev => prev.map(s => s.id === id ? { ...s, _ovx: x, _ovy: y } : s));
  };

  const handleSelect = (scene) => {
    setSelectedElement({
      type: "scene",
      id: scene.id,
      name: scene.name,
      asset: { background: scene.background, sound: scene.sound || null },
    });
  };

  // Build arrows: for each exit place with a name, link to scenes that have an entry with same name
  const arrows = [];
  scenes.forEach(srcScene => {
    const srcX = srcScene._ovx ?? 0;
    const srcY = srcScene._ovy ?? 0;
    const srcW = w;
    const srcH = h;
    srcScene.places?.forEach(place => {
      if ((place.placeType === "exit") && place.name) {
        // find scenes with entry of same name
        scenes.forEach(dstScene => {
          if (dstScene.id === srcScene.id) return;
          const match = dstScene.places?.some(p => p.placeType === "entry" && p.name === place.name);
          if (match) {
            arrows.push({
              id: `${srcScene.id}__${dstScene.id}__${place.name}`,
              from: { x: srcX + srcW, y: srcY + srcH/2 },
              to: { x: (dstScene._ovx ?? 0), y: (dstScene._ovy ?? 0) + srcH/2 },
              label: place.name,
            });
          }
        });
      }
    });
  });

  return ( //#a4a7df
    <div className="scene-overview">
      <Stage width={width} height={height}>
        <Layer>
          {/* background grid */}
          <Rect x={0} y={0} width={width} height={height} 
          fill="#a4a7df"
          //fill="#fff"
          listening={true} />
          {/* arrows */}
          {arrows.map(a => (
            <React.Fragment key={a.id}>
              <Arrow
                points={[a.from.x + 20, a.from.y, a.to.x - 20, a.to.y]}
                stroke="black" fill="white"
                lineCap="round" lineJoin="round"
                pointerLength={12} pointerWidth={15}
                listening={false}
              />
              <Text x={(a.from.x + a.to.x) / 2 - 40} y={(a.from.y + a.to.y) / 2 - 12} text={a.label} fontSize={12} fill="#222" />
            </React.Fragment>
          ))}

          {/* scene thumbnails */}
          {scenes.map((scene) => {
            const x = scene._ovx ?? 0;
            const y = scene._ovy ?? 0;
            const thumbW = w;
            const thumbH = h;
            return (
              <Group
                key={scene.id}
                x={x} y={y}
                draggable
                onDragMove={(e) => handleDragMove(scene.id, e)}
                onClick={() => handleSelect(scene)}
                onDblClick={() => {
                  if (setCurrentSceneId) {
                    setCurrentSceneId(scene.id);
                  }
                }}
              >
                {/* background image */}
                <LoadImage
                  x={thumbW/2}
                  y={thumbH/2}
                  src={scene.background}
                  width={thumbW}
                  height={thumbH}
                />
                {/* frame and info overlay */}
                {/*<Rect x={0} y={0} width={thumbW} height={thumbH} stroke="#333" strokeWidth={2} listening={false} />*/}
                <Rect x={0} y={0} width={thumbW} height={28} fill="rgba(0,0,0,0.45)" listening={false} />
                <Text x={8} y={8} text={scene.name || `Scene ${scene.id}`} fontSize={14} fill="#fff" />
                {/*<Text x={8} y={8} text={`ID: ${scene.id}`} fontSize={12} fill="#fff" />*/}
                {/*entry/exit places indicators*/}
                {/*scene.places?.map((p, idx) => {
                  if (!p.name) return null;
                  const px = (idx % 6) * 50 + 8;
                  const py = thumbH - 60 - Math.floor(idx / 6) * 20;
                  return (
                    <Text key={p.id} x={px} y={py} text={`${p.placeType[0].toUpperCase()}:${p.name}`} fontSize={12} fill="#111" />
                  );
                })*/}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default SceneOverview;