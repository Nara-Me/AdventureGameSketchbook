import React from "react";
import { Stage, Layer, Circle, Rect, Text, Arrow , Line} from "react-konva";
import AssetLibrary from "./AssetLibrary";

const GAP_SIZE = 7; //7
const BORDER_SIZE = 2;
const PLACE_RADIUS = 20; //20
const TRANSITION_WIDTH = 100;
const TRANSITION_HEIGHT = 40;

function Toolbar({
  selectedTool, setSelectedTool,
  showAssetLibrary, setShowAssetLibrary,
  userImages, userAudios, userBackgrounds,
  handleImageUpload, handleAudioUpload, handleBackgroundsUpload,
  availableImages, availableSounds, availableBackgrounds,
  onSelectImage, onSelectAudio, onSelectBackground,
}) {
  const [assetTab, setAssetTab] = React.useState("images");
  return (
    <div className="tools-sidebar">
      <div className="toolbar-tabs">
        <button
          className={`toolbar-tab${!showAssetLibrary ? " active" : ""}`}
          onClick={() => setShowAssetLibrary(false)}
        >
          Tools
        </button>
        <button
          className={`toolbar-tab${showAssetLibrary ? " active" : ""}`}
          onClick={() => {
            setShowAssetLibrary(true);
            setSelectedTool(selectedTool == null);
          }}>
          Assets
        </button>
      </div>
      {!showAssetLibrary ? (
        <div className="tool-select">
          <div className="tool-select-circles">
            {/* Entry Point */}
            <div
              //className={`tool-btn entry${selectedTool === "entry" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "entry" ? null : "entry")}
              title="Entry point"
            >
              <div className="entry"></div>
              <PlaceToolIcon placeType="entry" selected={selectedTool === "entry"}/>
            </div>
            {/* Place Tool */}
            <div
              //className={`tool-btn place${selectedTool === "place" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "place" ? null : "place")}
              title="Tokens place"
            >
              <PlaceToolIcon placeType="normal" selected={selectedTool === "place"}/>
            </div>
            {/* Exit Point */}
            <div
              //className={`tool-btn exit${selectedTool === "exit" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "exit" ? null : "exit")}
              title="Exit point"
            >
              <PlaceToolIcon placeType="exit" selected={selectedTool === "exit"}/>
              <div className="exit"></div>
            </div>
          </div>

          {/* Arc Tool */}
          <div
            //className={`tool-btn arc${selectedTool === "arc" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "arc" ? null : "arc")}
            title="Connect actions and places"
          >
            <ArcToolIcon selected={selectedTool === "arc"} />
          </div>

          {/* Transition Tool */}
          {/*<div
            className={`tool-btn transition${selectedTool === "transition" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "transition" ? null : "transition")}
          ></div>*/}
          {/* Start Tool */}
          <div
            onClick={() => setSelectedTool(selectedTool === "start" ? null : "start")}
            title="Game Start"
          >
            <TransitionToolIcon name="Start" selected={selectedTool === "start"} />
          </div>
          {/* Sensor Tool */}
          <div
            //className={`tool-btn transition sensor${selectedTool === "sensor" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "sensor" ? null : "sensor")}
            title="Sensor"
          >
            <TransitionToolIcon name="Sensor" selected={selectedTool === "sensor"}/>
          </div>
          {/* Interact Tool */}
          <div
            //className={`tool-btn transition interact${selectedTool === "interact" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "interact" ? null : "interact")}
            title="Interact"
          >
            <TransitionToolIcon name="Interact" selected={selectedTool === "interact"}/>
          </div>
          {/* Talk Tool */}
          <div
            //className={`tool-btn transition talk${selectedTool === "talk" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "talk" ? null : "talk")}
            title="Talk To"
          >
            <TransitionToolIcon name="Talk to" selected={selectedTool === "talk"}/>
          </div>
          {/* Look Tool */}
          <div
            //className={`tool-btn transition look${selectedTool === "look" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "look" ? null : "look")}
            title="Look At"
          >
            <TransitionToolIcon name="Look at" selected={selectedTool === "look"}/>
          </div>
        </div>
      ) : (
        <div>
          <div className="asset-subtabs">
            <button
              className={`asset-subtab${assetTab === "images" ? " active" : ""}`}
              onClick={() => setAssetTab("images")}
            >
              Props
            </button>
            <button
              className={`asset-subtab${assetTab === "backgrounds" ? " active" : ""}`}
              onClick={() => setAssetTab("backgrounds")}
            >
              Backgrounds
            </button>
            <button
              className={`asset-subtab${assetTab === "audios" ? " active" : ""}`}
              onClick={() => setAssetTab("audios")}
            >
              Audios
            </button>
          </div>
          {assetTab === "images" ? (
            <AssetLibrary
              userImages={userImages}
              availableImages={availableImages}
              onSelectImage={onSelectImage}
              handleImageUpload={handleImageUpload}
              showImages
            />
          ) : assetTab === "backgrounds" ? (
            <AssetLibrary
              userBackgrounds={userBackgrounds}
              availableBackgrounds={availableBackgrounds}
              onSelectBackground={onSelectBackground}
              handleBackgroundsUpload={handleBackgroundsUpload}
              showBackgrounds
            />
          ) : (
            <AssetLibrary
              userAudios={userAudios}
              availableSounds={availableSounds}
              onSelectAudio={onSelectAudio}
              handleAudioUpload={handleAudioUpload}
              showAudios
            />
          )}
        </div>
      )}
    </div>
  );
}

function PlaceToolIcon({ placeType, selected }) {
  return (
    <Stage width={40+BORDER_SIZE} height={40+BORDER_SIZE}>
      <Layer>
        <Circle
          x={20+BORDER_SIZE/2}
          y={20+BORDER_SIZE/2}
          radius={PLACE_RADIUS}
          fill="white"
          stroke="black"
          strokeWidth={BORDER_SIZE}
        />
        {selected && (
          <Circle
            x={20+BORDER_SIZE/2}
            y={20+BORDER_SIZE/2}
            radius={PLACE_RADIUS}
            fill="#e0e2f7"
            stroke="#a4a7df"
            //stroke="black"
            strokeWidth={BORDER_SIZE}
          />
        )}
        {placeType === "entry" && (
          <Circle x={20+BORDER_SIZE/2} y={20+BORDER_SIZE/2} radius={6} fill="black" />
        )}
        {placeType === "exit" && (
          <>
          <Line points={[8, 8, 40+BORDER_SIZE-8, 40+BORDER_SIZE-8]}
          stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
          <Line points={[8, 40+BORDER_SIZE-8, 40+BORDER_SIZE-8, 8]}
          stroke="black" lineCap="round" lineJoin="round" strokeWidth={BORDER_SIZE} />
          </>
        )}
      </Layer>
    </Stage>
  );
}

function ArcToolIcon({selected}) {
  return(
    <Stage width={TRANSITION_WIDTH+BORDER_SIZE} height={TRANSITION_HEIGHT+BORDER_SIZE}>
      <Layer>
        {selected && (
          <Rect
            x={BORDER_SIZE}
            y={BORDER_SIZE}
            width={TRANSITION_WIDTH-BORDER_SIZE}
            height={40-BORDER_SIZE}
            fill="#e0e2f7"
            stroke="#a4a7df"
            strokeWidth={BORDER_SIZE}
            cornerRadius={5}
          />
        )}
        <Arrow
          key={-5}
          points={[20, TRANSITION_HEIGHT/2, TRANSITION_WIDTH-20, TRANSITION_HEIGHT/2]}
          stroke="black" fill="white"
          lineCap="round" lineJoin="round"
          pointerLength={12} pointerWidth={15}
          //dashEnabled dash={20}
          //bezier="true" tension={5}
          strokeWidth={BORDER_SIZE}
          hitStrokeWidth={BORDER_SIZE+18}
        />
      </Layer>
    </Stage>
  )
}

function TransitionToolIcon({ name, selected }) {
  return (
    <Stage width={TRANSITION_WIDTH+BORDER_SIZE} height={TRANSITION_HEIGHT+BORDER_SIZE}>
      <Layer>
        <Rect
          x={BORDER_SIZE}
          y={BORDER_SIZE}
          width={TRANSITION_WIDTH-BORDER_SIZE}
          height={TRANSITION_HEIGHT-BORDER_SIZE}
          fill="white"
          stroke="black"
          strokeWidth={BORDER_SIZE}
          cornerRadius={5}
        />
        {selected && (
          <Rect
            x={BORDER_SIZE}
            y={BORDER_SIZE}
            width={TRANSITION_WIDTH-BORDER_SIZE}
            height={TRANSITION_HEIGHT-BORDER_SIZE}
            fill="#e0e2f7"
            stroke="#a4a7df"
            strokeWidth={BORDER_SIZE}
            cornerRadius={5}
          />
        )}
        <Text
          x={TRANSITION_WIDTH/3-BORDER_SIZE*2}
          y={TRANSITION_HEIGHT/2-BORDER_SIZE*2}
          text={name}
          fontSize={14}
          fill="black"
        />
      </Layer>
    </Stage>
  );
}

export default Toolbar;