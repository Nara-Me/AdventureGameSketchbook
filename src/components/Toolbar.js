import React from "react";
import AssetLibrary from "./AssetLibrary";

function Toolbar({
  selectedTool,
  setSelectedTool,
  showAssetLibrary,
  setShowAssetLibrary,
  userImages,
  userAudios,
  handleImageUpload,
  handleAudioUpload,
  availableImages,
  availableSounds,
  onSelectImage,
  onSelectAudio,
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
          onClick={() => setShowAssetLibrary(true)}
        >
          Assets
        </button>
      </div>
      {!showAssetLibrary ? (
        <div class="tool-select">
          {/* Place Tool */}
          <div
            className={`tool-btn place${selectedTool === "place" ? " selected" : ""}`}
            onClick={() => setSelectedTool(selectedTool === "place" ? null : "place")}
          ></div>

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
              Images
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
        /*<AssetLibrary
          userImages={userImages}
          userAudios={userAudios}
          handleImageUpload={handleImageUpload}
          handleAudioUpload={handleAudioUpload}
          availableImages={availableImages}
          availableSounds={availableSounds}
          onSelectImage={onSelectImage}
          onSelectAudio={onSelectAudio}
        />*/
        
      )}
    </div>
  );
}

export default Toolbar;