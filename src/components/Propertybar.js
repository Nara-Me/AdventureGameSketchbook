//fix the cyclic on the element
//fix the naming of the audios in the select menu
//make it possible to have zero scenes??
//also to delete assets from the library with a context menu

import React, { useState, useEffect } from "react";

const Properties = ({ selectedElement, updateElementAsset, availableImages, availableSounds, selectedTool, setSelectedTool, availableBackgrounds, updateScene }) => {
  //variables to store the selected image, sound
  const [selectedImage, setSelectedImage] = useState(null); //selected image for each element
  const [selectedSound, setSelectedSound] = useState(null); //selected sound for each element
  const [audioMode, setAudioMode] = useState(null); //sound play modes cyclic, interact, passThrough
  //const [allowPartialFiring, setAllowPartialFiring] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false); //image asset menu in properties
  const [assetNaturalSize, setAssetNaturalSize] = useState({ width: 1, height: 1 }); //image size in run mode set in properties
  const [aspectLocked, setAspectLocked] = useState(true); //lock the aspect ratio of the images in run mode or not

  //update the component when the selectedElement asset changes
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.type === "scene") {
        setSelectedImage(selectedElement.asset?.background ? { src: selectedElement.asset.background } : null);
        setSelectedSound(selectedElement.asset?.sound ? { src: selectedElement.asset.sound } : null);
        setAudioMode("cyclic");
      } else {
        setSelectedImage(selectedElement.asset?.image || null);
        setSelectedSound(selectedElement.asset?.sound || null);
        setAudioMode(selectedElement.asset?.audioMode || "interact"); //cyclic is not working for the element ;-;
      }
    }
  }, [selectedElement]);
  
  useEffect(() => {
   //when image changes, update natural size
    if (selectedImage?.src) {
      const img = new window.Image();
      img.onload = () => setAssetNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      img.src = selectedImage.src;
    }
  }, [selectedImage]);

  //if no element is selected, hide the properties bar
  if (!selectedElement) {
    return null;
  }

  //scene overview handlers
  const handleSceneNameChange = (name) => {
    if (selectedElement?.type === "scene" && updateScene) {
      updateScene(selectedElement.id, { name });
    }
  };
  const handleSceneBackgroundSelect = (image) => {
    setSelectedImage(image);
    if (selectedElement?.type === "scene" && updateScene) {
      updateScene(selectedElement.id, { background: image.src });
    } else if (selectedElement) {
      // existing element image logic
      const img = new window.Image();
      img.onload = () => {
        updateElementAsset(
          selectedElement.id,
          selectedElement.type,
          { image, sound: selectedSound, assetSize: { width: img.naturalWidth, height: img.naturalHeight } },
          selectedElement.allowPartialFiring
        );
      };
      img.src = image.src;
    }
    setIsImageSelectorOpen(false);
  };
  const handleSceneSoundChange = (soundSrc) => {
    const sound = soundSrc ? { src: soundSrc } : null;
    setSelectedSound(sound);
    if (selectedElement?.type === "scene" && updateScene) {
      updateScene(selectedElement.id, { sound: soundSrc || null });
    } else if (selectedElement) {
      //updateElementAsset(selectedElement.id, selectedElement.type, { image: selectedImage, sound }, selectedElement.allowPartialFiring);
      updateElementAsset(selectedElement.id, selectedElement.type, { image: selectedImage, sound, audioMode: audioMode || "cyclic" }, selectedElement.allowPartialFiring);
    }
  };

  //when selecting image normally for elements
  const handleImageSelect = (image) => {
    if (selectedElement?.type === "scene") {
      handleSceneBackgroundSelect(image);
      return;
    }
    setSelectedImage(image); //set the selected image in the state
    if (selectedElement) {
      //update the asset (keep sound as it was)
      //updateElementAsset(selectedElement.id, selectedElement.type, { image, sound: selectedSound }, selectedElement.allowPartialFiring);
      const img = new window.Image();
      img.onload = () => {
        updateElementAsset(
          selectedElement.id, selectedElement.type,
          {
            image, sound: selectedSound,
            assetSize: { width: img.naturalWidth, height: img.naturalHeight } //gets the images real size
          },
          selectedElement.allowPartialFiring
        );
      };
      img.src = image.src;
    }
    setIsImageSelectorOpen(false); //close the image selector
  };

  const handleSoundChange = (e) => {
    const sound = availableSounds.find((s) => s.src === e.target.value);
    setSelectedSound(sound);
    if (selectedElement) {
      //update the asset (keep image as it was)
      updateElementAsset(selectedElement.id, selectedElement.type, { image: selectedImage, sound }, selectedElement.allowPartialFiring);
    }
  };

  //clears the image info of the element
  const handleClearImage = () => {
    setSelectedImage(null);
    if (selectedElement?.type === "scene") {
      updateScene?.(selectedElement.id, { background: null });
    } else if (selectedElement) {
      //remove image asset
      updateElementAsset(selectedElement.id, selectedElement.type, { image: null, sound: selectedSound }, selectedElement.allowPartialFiring);
    }
  };

  //toggle the Allow Partial Firing checkbox
  const handleAllowPartialFiringChange = (e) => {
    const isChecked = e.target.checked;
    //console.log(selectedElement.allowPartialFiring);
    //setAllowPartialFiring(isChecked);
    //console.log(isChecked);
    if (selectedElement) {
      updateElementAsset(
        selectedElement.id,
        selectedElement.type,
        {
          ...selectedElement.asset, //keep all other properties unchanged
          
        },
        !isChecked,
      );
    }
  };

  const assetSize = selectedElement.asset?.assetSize || { width: 50, height: 50 }; //sets size to 50 by 50
  const aspectRatio = assetNaturalSize.width / assetNaturalSize.height;

  const handleAssetWidthChange = (e) => {
    const width = Number(e.target.value);
    let height = assetSize.height;
    if (aspectLocked) {
      height = Math.round(width / aspectRatio);
    }
    updateElementAsset(
      selectedElement.id,
      selectedElement.type,
      {
        ...selectedElement.asset,
        assetSize: { width, height },
      },
      selectedElement.allowPartialFiring,
    );
  };

  const handleAssetHeightChange = (e) => {
    const height = Number(e.target.value);
    let width = assetSize.width;
    if (aspectLocked) {
      width = Math.round(height * aspectRatio);
    }
    updateElementAsset(
      selectedElement.id,
      selectedElement.type,
      {
        ...selectedElement.asset,
        assetSize: { width, height },
      },
      selectedElement.allowPartialFiring,
    );
  };

  // format sound labels: prefer uploaded name, otherwise use file name from path, fallback for data urls
  const formatSoundLabel = (s) => {
    if (!s) return "";
    if (s.name) return s.name;
    if (typeof s.src === "string") {
      if (s.src.startsWith("data:")) return "uploaded audio";
      const parts = s.src.split("/");
      return parts[parts.length - 1] || s.src;
    }
    return String(s.src);
  };

  // Audio mode selector for non-scene elements
  const handleAudioModeChange = (value) => {
    setAudioMode(value);
    if (selectedElement) {
      updateElementAsset(selectedElement.id, selectedElement.type, { ...selectedElement.asset, audioMode: value }, selectedElement.allowPartialFiring);
    }
  };

  const ConsoleLog = ({ children }) => { //for debbuging
    console.log(children);
    return false;
  };

return (
    <div className="properties-sidebar" onClick={() => setSelectedTool(selectedTool == null) }>
      <div className="properties-content">
        <h3>{selectedElement.name || "Undefined"}</h3>
        {/*<ConsoleLog>{selectedElement.type}</ConsoleLog>*/}

        {selectedElement?.type === "scene" ? ( //if in overview scenes mode, property bar is different
          <div className="properties-overview">
            {/* Name Setting */}
            <label>
              Scene Name:
              <input
                placeholder="Scene Name" type="text"
                value={selectedElement.name || ""}
                onChange={e => handleSceneNameChange(e.target.value)}
                style={{ width: "100%", marginTop: 6 }}
              />
            </label>

            {/* Background Image Setting */}
            <div style={{ marginTop: 8 }}>
              <label>
                Background:
                <button onClick={() => setIsImageSelectorOpen(true)} style={{ marginLeft: 8 }}>Select Background</button>
              </label>
              {selectedImage && (
                <img src={selectedImage.src} alt="bg" width={120} style={{ display: "block", marginTop: 8 }} />
              )}
              {isImageSelectorOpen && (
                <div className="image-selector">
                  <h3>Select a Background</h3>
                  <div className="image-selector-ele">
                    {availableBackgrounds.map((image, index) => (
                      <img
                        key={index} src={image.src}
                        alt={`bg-${index}`}
                        width={80} height={60}
                        style={{border: selectedImage?.src === image.src ? "2px solid white" : "1px solid darkslateblue", backgroundColor:selectedImage?.src === image.src ? "#ffffff4a" : "#7867ab07" }}
                        onClick={() => handleImageSelect(image)}
                      />
                    ))}
                  </div>
                  <button onClick={() => setIsImageSelectorOpen(false)} style={{ marginTop: 10 }}>Close</button>
                </div>
              )}
            </div>

            {/* Background Ambience Setting */}
            <label style={{ marginTop: 8 }}>
              Ambience:
              {/*<select value={selectedSound?.src || ""} onChange={e => handleSceneSoundChange(e.target.value)}>
                <option value="">None</option>
                {availableSounds.map((sound, idx) => <option key={idx} value={sound.src}>{sound.src}</option>)}
              </select>*/}
              <select value={selectedSound?.src || ""} onChange={e => handleSceneSoundChange(e.target.value)}>
                 <option value="">None</option>
                 {availableSounds.map((sound, idx) => (
                   <option key={idx} value={sound.src}>
                     {formatSoundLabel(sound)}
                   </option>
                 ))}
                </select>
            </label>
          </div>
        ) : (
          <>
            {/* Name Setting */}
            {(selectedElement.type === "place" || selectedElement.transitionType === "interact") && (
              <label>
                <input
                  placeholder="Element Name"
                  type="text"
                  value={selectedElement.name || ""}
                  onChange={e =>
                    updateElementAsset(
                      selectedElement.id,
                      selectedElement.type,
                      { ...selectedElement.asset },
                      selectedElement.allowPartialFiring,
                      e.target.value // pass the name
                    )
                  }
                />
              </label>
            )}

            {/* Area size and boolean Setting */}
            {/*(selectedElement.transitionType === "sensor" || selectedElement.transitionType === "start") && (*/}
            {selectedElement.type === "transition" && (
              <div style={{ marginTop: 8 }}>
                <label>
                  Area size:
                  <input
                    type="number"
                    min={1}
                    value={selectedElement.asset?.areaSize ?? 70}
                    onChange={e =>
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          areaSize: Number(e.target.value)
                        },
                        selectedElement.allowPartialFiring
                      )
                    }
                    style={{ width: 60, marginLeft: 5 }}
                  />
                </label>
                <label style={{ marginLeft: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.asset?.showArea}
                    onChange={e =>
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          showArea: e.target.checked
                        },
                        selectedElement.allowPartialFiring
                      )
                    }
                  />
                  Show area
                </label>
                {selectedElement.transitionType === "sensor" && (
                <label style={{ marginLeft: 8}}>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.asset?.booleanSensor}
                    onChange={e =>
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          booleanSensor: e.target.checked
                        },
                        selectedElement.allowPartialFiring
                      )
                    }
                  />
                  Boolean mode
                </label>
                )}
              </div>
            )}

            {/* Description text Setting */}
            {(selectedElement.transitionType === "look" || selectedElement.transitionType === "talk") && (
            <div style={{ marginTop: 8 }}>
              <label>
                Description:
                <textarea
                  value={selectedElement.asset?.dialogueText || ""}
                  onChange={e =>
                    updateElementAsset(
                      selectedElement.id,
                      selectedElement.type,
                      {
                        ...selectedElement.asset,
                        dialogueText: e.target.value
                      },
                      selectedElement.allowPartialFiring
                    )
                  }
                  style={{ width: "100%", minHeight: 60, marginTop: 4 }}
                />
              </label>
            </div>
            )}

            {/* Dialogue and options Setting */}
            {selectedElement.transitionType === "talk" && (
            <div style={{ marginTop: 8 }}>
              <label>Dialogue Options:</label>
              {(selectedElement.asset?.dialogueOptions || [""]).map((opt, idx) => ( //check for dialogue options
                <div key={idx} style={{ display: "flex", marginBottom: 4 }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOptions = [...(selectedElement.asset?.dialogueOptions || ["..."])];
                      newOptions[idx] = e.target.value;
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          dialogueOptions: newOptions
                        },
                        selectedElement.allowPartialFiring
                      );
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => {
                      const newOptions = (selectedElement.asset?.dialogueOptions || [""]).filter((_, i) => i !== idx);
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          dialogueOptions: newOptions.length ? newOptions : [""]
                        },
                        selectedElement.allowPartialFiring
                      );
                    }}
                    style={{ marginLeft: 4 }}
                  >❌</button>
                </div> //❌ 🗑️
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(selectedElement.asset?.dialogueOptions || [""]), ""];
                  updateElementAsset(
                    selectedElement.id,
                    selectedElement.type,
                    {
                      ...selectedElement.asset,
                      dialogueOptions: newOptions
                    },
                    selectedElement.allowPartialFiring
                  );
                }}
                style={{ marginTop: 4 }}
              >Add Option</button>
            </div>
            )}

            {/* Image selection */}
            <label>
              Image:
              <button onClick={() => setIsImageSelectorOpen(true)}>Select Image</button>
              <button onClick={handleClearImage} style={{ marginLeft: "10px" }}>
                Clear Image
              </button>
            </label>
            {selectedImage && (
            <>
              <img src={selectedImage.src} alt="Selected" width={50} style={{ display: "block", marginTop: "10px" }} />
            </>
            )}
            {isImageSelectorOpen && (
            <div className="image-selector">
              <h3>Select an Image</h3>
              <div className="image-selector-ele">
                {availableImages.map((image, index) => (
                  <img
                    key={index} src={image.src}
                    alt={`image-${index}`}
                    width={50} height={50}
                    style={{border: selectedImage?.src === image.src ? "2px solid white" : "1px solid darkslateblue", backgroundColor:selectedImage?.src === image.src ? "#ffffff4a" : "#7867ab07" }}
                    onClick={() => handleImageSelect(image)}
                  />
                ))}
              </div>
              <button onClick={() => setIsImageSelectorOpen(false)} style={{ marginTop: 10 }}>Close</button>
            </div>
            )}

            {/* Image sizing */}
            {selectedImage && (
            <div className="asset-size-controls">
              <label>
                Width:
                <input
                  type="number"
                  value={selectedElement.asset?.assetSize?.width || 50}
                  min={1}
                  onChange={/*e => {
                    const width = Number(e.target.value);
                    const height = selectedElement.asset?.assetSize?.height || 50;
                    updateElementAsset(selectedElement.id, selectedElement.type, { ...selectedElement.asset, assetSize: { width, height } }, selectedElement.allowPartialFiring);
                  }*/handleAssetWidthChange}
                  className="asset-size-input"
                />
              </label>
              <label>
                Height:
                <input
                  type="number"
                  value={selectedElement.asset?.assetSize?.height || 50}
                  min={1}
                  onChange={/*e => {
                    const height = Number(e.target.value);
                    const width = selectedElement.asset?.assetSize?.width || 50;
                    updateElementAsset(selectedElement.id, selectedElement.type, { ...selectedElement.asset, assetSize: { width, height } }, selectedElement.allowPartialFiring);
                  }*/handleAssetHeightChange}
                  className="asset-size-input"
                />
              </label>
              <button onClick={() => setAspectLocked(prev => !prev)} className="aspect-lock-btn">{aspectLocked ? "🔒" : "🔓"}</button>
            </div>
            )}

            {/* Image flip */}
            {selectedImage && (
            <div style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedElement.asset?.flipX}
                  onChange={e =>
                    updateElementAsset(
                      selectedElement.id,
                      selectedElement.type,
                      {
                        ...selectedElement.asset,
                        flipX: e.target.checked
                      },
                      selectedElement.allowPartialFiring
                    )
                  }
                />
                Flip Image 🔄
              </label>
            </div>
            )}

            {/* Image positioning */}
            {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && (
            <div style={{marginTop: 8}}>
              <label>Position:<br></br></label>
              <label>
                X:
                <input
                  type="number"
                  value={selectedElement.asset?.assetPosition?.x ?? 0}
                  onChange={e =>
                    updateElementAsset(
                      selectedElement.id,
                      selectedElement.type,
                      {
                        ...selectedElement.asset,
                        assetPosition: {
                          x: Number(e.target.value),
                          y: selectedElement.asset?.assetPosition?.y ?? 0
                        }
                      },
                      selectedElement.allowPartialFiring,
                    )
                  }
                  style={{ width: 60, marginLeft: 5 }}
                />
              </label>
              <label style={{ marginLeft: 10 }}>
                Y:
                <input
                  type="number"
                  value={selectedElement.asset?.assetPosition?.y ?? 0}
                  onChange={e =>
                    updateElementAsset(
                      selectedElement.id,
                      selectedElement.type,
                      {
                        ...selectedElement.asset,
                        assetPosition: {
                          x: selectedElement.asset?.assetPosition?.x ?? 0,
                          y: Number(e.target.value)
                        }
                      },
                      selectedElement.allowPartialFiring,
                    )
                  }
                  style={{ width: 60, marginLeft: 5 }}
                />
              </label>
            </div>
            )}

            {/* Sound Selection */}
            {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && selectedElement.type !== "scene" && (
            <div style={{marginTop: 8}}>
              <label>
                Sound:
                <select value={selectedSound?.src || ""} onChange={handleSoundChange}>
                  <option value="">None</option>
                  {availableSounds.map((sound, index) => (
                    <option key={index} value={sound.src}>
                      {formatSoundLabel(sound)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            )}

            {/* Audio playback mode */}
            {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && selectedElement.type !== "scene" && (
              <div style={{ marginTop: 8 }}>
                {/*<label>Audio Mode:</label>
                <select value={audioMode || "interact"} onChange={e => handleAudioModeChange(e.target.value)}>
                  <option value="interact">Only when interacted</option>
                  <option value="passThrough">When passed through</option>
                  <option value="cyclic">Cyclic (loop while available)</option>
                </select>*/}
                <label style={{ display: "block", marginBottom: 6 }}>Audio Mode:</label>
                 <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                   <button
                     type="button"
                     className={"audio-mode-btn" + (audioMode === "interact" ? " active" : "")}
                     title="Play only when interacted"
                     onClick={() => handleAudioModeChange("interact")}
                   >
                     When interacted 🖱️
                   </button>
                   <button
                     type="button"
                     className={"audio-mode-btn" + (audioMode === "passThrough" ? " active" : "")}
                     title="Play when passed through"
                     onClick={() => handleAudioModeChange("passThrough")}
                   >
                     When near 🚶
                   </button>
                   <button
                     type="button"
                     className={"audio-mode-btn" + (audioMode === "cyclic" ? " active" : "")}
                     title="Cyclic (loop while available)"
                     onClick={() => handleAudioModeChange("cyclic")}
                   >
                     Always 🔁
                   </button>
                 </div>
              </div>
            )}

            {/* Allow Partial Firing option for transitions only */}
            {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && (
            <label>
              <input
                type="checkbox"
                checked={!selectedElement.allowPartialFiring}
                onChange={/*e =>
                  updateElementAsset(
                    selectedElement.id, selectedElement.type,
                    { ...selectedElement.asset },
                    !e.target.checked
                  )*/handleAllowPartialFiringChange
                }
              />
              Need all inputs to use
            </label>
            )}

            {/* Asset conditional appearence */}
            {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && (
              <div style={{ marginTop: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.asset?.showWhenAvailable}
                    onChange={e =>
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          showWhenAvailable: e.target.checked
                        },
                        selectedElement.allowPartialFiring
                      )
                    }
                  />
                  Show when interactable
                </label>
                <label style={{ marginLeft: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.asset?.hideAfterUse}
                    onChange={e =>
                      updateElementAsset(
                        selectedElement.id,
                        selectedElement.type,
                        {
                          ...selectedElement.asset,
                          hideAfterUse: e.target.checked
                        },
                        selectedElement.allowPartialFiring
                      )
                    }
                  />
                  Hide after
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Properties;
