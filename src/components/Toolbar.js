import React from "react";
import AssetLibrary from "./AssetLibrary";

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
        <div class="tool-select">
          <div class="tool-select-circles">
            {/* Entry Point */}
            <div
              className={`tool-btn entry${selectedTool === "entry" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "entry" ? null : "entry")}
            >
              <div class="entry"></div>
            </div>
            {/* Place Tool */}
            <div
              className={`tool-btn place${selectedTool === "place" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "place" ? null : "place")}
            ></div>
            {/* Exit Point */}
            <div
              className={`tool-btn exit${selectedTool === "exit" ? " selected" : ""}`}
              onClick={() => setSelectedTool(selectedTool === "exit" ? null : "exit")}
            >
              <div class="exit"></div>
            </div>
          </div>

          {/* Arc Tool */}
          <div
            className={`tool-btn arc${selectedTool === "arc" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "arc" ? null : "arc")}
          ></div>

          {/* Transition Tool */}
          <div
            className={`tool-btn transition${selectedTool === "transition" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "transition" ? null : "transition")}
          ></div>
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

export default Toolbar;