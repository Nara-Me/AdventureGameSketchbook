import React, { useState, useEffect } from "react";

const Properties = ({ selectedElement, updateElementAsset, availableImages, availableSounds, selectedTool, setSelectedTool }) => {
  //variables to store the selected image, sound
  const [selectedImage, setSelectedImage] = useState(null); //selected image for each element
  const [selectedSound, setSelectedSound] = useState(null); //selected sound for each element
  //const [allowPartialFiring, setAllowPartialFiring] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false); //image asset menu in properties
  const [assetNaturalSize, setAssetNaturalSize] = useState({ width: 1, height: 1 }); //image size in run mode set in properties
  const [aspectLocked, setAspectLocked] = useState(true); //lock the aspect ratio of the images in run mode or not

  //update the component when the selectedElement asset changes
  useEffect(() => {
    if (selectedElement) {
      setSelectedImage(selectedElement.asset?.image || null);
      setSelectedSound(selectedElement.asset?.sound || null);
      //console.log(!!selectedElement.allowPartialFiring);
      //setAllowPartialFiring(selectedElement.allowPartialFiring || false);
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

  const handleImageSelect = (image) => {
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
    if (selectedElement) {
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

  const ConsoleLog = ({ children }) => { //for debbuging
    console.log(children);
    return false;
  };

  return (
    <div className="properties-sidebar" onClick={() => setSelectedTool(selectedTool == null) }>
      <h3>{selectedElement.name || "Undefined"}</h3>
      {/*<ConsoleLog>{selectedElement.type}</ConsoleLog>*/}

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
          <label style={{ marginLeft: 7}}>
            <input
              type="checkbox"
              checked={!!selectedElement.asset?.booleanSensor} // make it start as checked (and actually work!!!!)
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
              >🗑️</button>
            </div> //❌
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

      {selectedElement.placeType !== "entry" && selectedElement.placeType !== "exit" && (
        <>
        {/* Image Selection */}
        <label>
          Image:
          <button onClick={() => setIsImageSelectorOpen(true)}>Select Image</button>
          <button onClick={handleClearImage} style={{ marginLeft: "10px" }}>
            Clear Image
          </button>
        </label>
        
        {/* Show selected image thumbnail if an image is selected */}
        {selectedImage && (
          <>
          <img
            src={selectedImage.src}
            alt="Selected"
            width={50}
            //height={50}
            style={{ display: "block", marginTop: "10px" }}
          />
        {/*<ConsoleLog>{assetSize.width}</ConsoleLog>*/}
        </>
        )}

        {/* Image Selector */}
        {isImageSelectorOpen && (
          <div className="image-selector">
            <h3>Select an Image</h3>
            <div className="image-selector-ele">
              {availableImages.map((image, index) => (
                <img
                  key={index}
                  src={image.src}
                  alt={`image-${index}`}
                  width={50}
                  height={50}
                  style={{ objectFit: "scale-down", cursor: "pointer", border: selectedImage?.src === image.src ? "2px solid blue" : "1px solid gray" }}
                  onClick={() => handleImageSelect(image)} //when an image is clicked, select it
                />
              ))}
            </div>
            <button onClick={() => setIsImageSelectorOpen(false)} style={{ marginTop: "10px" }}>
              Close
            </button>
          </div>
        )}

        {/* Image Sizing */}
        {selectedImage && (
          <div className="asset-size-controls">
            <label>
              Width:
              <input
                type="number"
                value={assetSize.width}
                min={1}
                onChange={handleAssetWidthChange}
                className="asset-size-input"
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={assetSize.height}
                min={1}
                onChange={handleAssetHeightChange}
                className="asset-size-input"
              />
            </label>
            <button
              onClick={() => setAspectLocked((prev) => !prev)}
              className="aspect-lock-btn"
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {aspectLocked ? "🔒" : "🔓"}
            </button>
          </div>
        )}
        {/* Image Flipping */}
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
              🔄
            </label>
          </div>
        )}
        {/* Image POsition */}
        {selectedElement.type === "transition" && selectedElement.transitionType !== "start" &&(
          <div>
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
        <label>
          Sound:
          <select value={selectedSound?.src || ""} onChange={handleSoundChange}>
            <option value="">None</option>
            {availableSounds.map((sound, index) => (
              <option key={index} value={sound.src}>
                {sound.src}
              </option>
            ))}
          </select>
        </label>

        {/* Allow Partial Firing option for transitions only */}
        {selectedElement.type === "transition" && selectedElement.transitionType !== "start" && (
          <label>
            <input
              type="checkbox"
              checked={!selectedElement.allowPartialFiring}
              onChange={handleAllowPartialFiringChange}
            />
            Need all inputs tokenized
          </label>
        )}
      </>)}
    </div>
  );
};

export default Properties;
