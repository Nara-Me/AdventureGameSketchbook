import React from "react";
import { Stage, Layer, Circle, Image} from "react-konva";
import LoadImage from "./LoadImage";

const SceneStage = ({
  width, height,
  backgroundImage, currentScene,
  character, characterAsset,
  showSensors = true,
  scale = 1,
  usedTransitions, wasAvailable,
}) => (
  <Stage width={width} height={height}>
    <Layer>
      {/* Background */}
      <Image
        x={0}
        y={0}
        width={width}
        height={height}
        image={backgroundImage}
      />
      {/* Sensor Area */}
      {currentScene.transitions
      .filter(t => {
          if (t.asset?.hideAfterUse && usedTransitions.has(t.id)) return false;
          if (t.asset?.showWhenAvailable) {
            const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
            const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);
            return (inputPlace && inputPlace.tokens > 0) || wasAvailable.has(t.id);
          }
          return true;
        })
      .map((t) => {
        if (
          //t.transitionType === "sensor" &&
          (t.asset?.showArea || showSensors) &&
          t.asset?.assetPosition
        ) {
          return (
            <Circle
              key={t.id + "_sensorarea"}
              x={t.asset.assetPosition.x * scale}
              y={t.asset.assetPosition.y * scale}
              radius={(t.asset.areaSize ?? 100) * scale}
              fill="rgba(255, 100, 100, 0.7)"
              listening={false}
            />
          );
        }
        return null;
      })}
      {/* Actions (Transitions) */}
      {currentScene.transitions
        .filter(t => t.transitionType !== "start") //skips the start transition
        .filter(t => {
          if (t.asset?.hideAfterUse && usedTransitions.has(t.id)) return false;
          if (t.asset?.showWhenAvailable) {
            const inputArc = currentScene.arcs.find(arc => arc.to.id === t.id && arc.from.type === "place");
            const inputPlace = inputArc && currentScene.places.find(p => p.id === inputArc.from.id);
            return (inputPlace && inputPlace.tokens > 0) || wasAvailable.has(t.id);
          }
          return true;
        })
        .map((t) =>
          t.asset?.image ? (
            <LoadImage
              key={t.id}
              x={(t.asset.assetPosition?.x ?? width * 0.3) * scale}
              y={(t.asset.assetPosition?.y ?? height * 0.7) * scale}
              src={t.asset.image.src}
              width={(t.asset.assetSize?.width ?? 50) * scale}
              height={(t.asset.assetSize?.height ?? 50) * scale}
              flipX={t.asset.flipX}
            />
          ) : null
        )}
      {/* Character */}
      {characterAsset?.image?.src && ( //if character asset is defined
        <>
          {(characterAsset.showArea || showSensors) && ( //
            <Circle
              x={character.x * scale}
              y={character.y * scale}
              radius={(characterAsset.areaSize ?? 100) * scale}
              fill="rgba(255, 100, 100, 0.7)"
            />
          )}
          <LoadImage
            x={character.x * scale}
            y={character.y * scale}
            src={characterAsset.image.src}
            width={(characterAsset.assetSize?.width || character.size) * scale}
            height={(characterAsset.assetSize?.height || character.size) * scale}
            flipX={characterAsset.flipX}
          />
        </>
      )}
    </Layer>
  </Stage>
);

export default SceneStage;