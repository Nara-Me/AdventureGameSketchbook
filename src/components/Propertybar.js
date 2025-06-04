// FIX THIS: the checkmark in properties disappears after updating the bar and resets it.


import React, { useState, useEffect } from "react";

const Properties = ({ selectedElement, updateElementAsset }) => {
  //variables to store the selected image, sound
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  //const [allowPartialFiring, setAllowPartialFiring] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  //images and sounds that can be selected
  const availableImages = [
    { type: "image", src: "./assets/imgs/objects/door.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_key.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_NPC.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_bag.png" },
  ];

  const availableSounds = [
    { type: "audio", src: "./assets/audio/yippee-tbh-creature-jazz.mp3" },
  ];

  //update the component when the selectedElement asset changes
  useEffect(() => {
    if (selectedElement) {
      setSelectedImage(selectedElement.asset?.image || null);
      setSelectedSound(selectedElement.asset?.sound || null);
      //console.log(!!selectedElement.allowPartialFiring);
      //setAllowPartialFiring(selectedElement.allowPartialFiring || false);
    }
  }, [selectedElement]);

  //if no element is selected, hide the properties bar
  if (!selectedElement) {
    return null;
  }

  const handleImageSelect = (image) => {
    setSelectedImage(image); //set the selected image in the state
    if (selectedElement) {
      //update the asset (keep sound as it was)
      updateElementAsset(selectedElement.id, selectedElement.type, { image, sound: selectedSound }, selectedElement.allowPartialFiring);
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

  //toggle the Allow Partial Firing checkbox (visually resets the bar for some reason)
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
          ...selectedElement.asset, //keep all other properties unchanged!
          
        },
        isChecked,
      );
    }
  };

  return (
    <div className="properties-sidebar">
      <h3>Properties</h3>
      <p>ID: {selectedElement.id}</p>
      <p>Type: {selectedElement.type}</p>

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
        <img
          src={selectedImage.src}
          alt="Selected"
          width={50}
          height={50}
          style={{ display: "block", marginTop: "10px" }}
        />
      )}

      {/* Image Selector */}
      {isImageSelectorOpen && (
        <div className="image-selector" style={{ position: "relative", top: "20px", background: "white", padding: "20px", border: "1px solid black" }}>
          <h4>Select an Image</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            {availableImages.map((image, index) => (
              <img
                key={index}
                src={image.src}
                alt={`image-${index}`}
                width={50}z
                height={50}
                style={{ cursor: "pointer", border: selectedImage?.src === image.src ? "2px solid blue" : "1px solid gray" }}
                onClick={() => handleImageSelect(image)} //when an image is clicked, select it
              />
            ))}
          </div>
          <button onClick={() => setIsImageSelectorOpen(false)} style={{ marginTop: "10px" }}>
            Close
          </button>
        </div>
      )}

      {/* Image POsition */}
      {/*selectedElement.type === "transition" &&*/ (
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
      {selectedElement.type === "transition" && (
        <label>
          Only need one input to activate:
          <input
            type="checkbox"
            checked={!!selectedElement.allowPartialFiring}
            onChange={handleAllowPartialFiringChange}
          />
        </label>
      )}
    </div>
  );
};

export default Properties;
