// FIX THIS: the checkmark in properties disappears after updating the bar and resets it.


import React, { useState, useEffect } from "react";

const Properties = ({ selectedElement, updateElementAsset }) => {
  // State variables to store the selected image, sound
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [allowPartialFiring, setAllowPartialFiring] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  //images and sounds that can be selected
  const availableImages = [
    { type: "image", src: "./assets/imgs/objects/door.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_key.png" },
  ];

  const availableSounds = [
    { type: "audio", src: "./assets/audio/yippee-tbh-creature-jazz.mp3" },
  ];

  // Update the component's state when the selectedElement prop changes
  useEffect(() => {
    if (selectedElement) {
      setSelectedImage(selectedElement.asset?.image || null);
      setSelectedSound(selectedElement.asset?.sound || null);
      setAllowPartialFiring(selectedElement.allowPartialFiring || false);
    }
  }, [selectedElement]);

  // If no element is selected, hide the properties panel
  if (!selectedElement) {
    return null;
  }

  const handleImageSelect = (image) => {
    setSelectedImage(image); // Set the selected image in the state
    if (selectedElement) {
      // Update the asset for the selected element (keep sound as it was)
      updateElementAsset(selectedElement.id, selectedElement.type, { image, sound: selectedSound });
    }
    setIsImageSelectorOpen(false); // Close the image selector
  };

  const handleSoundChange = (e) => {
    const sound = availableSounds.find((s) => s.src === e.target.value);
    setSelectedSound(sound);
    if (selectedElement) {
      // Update the element asset with the selected (keep image as it was)
      updateElementAsset(selectedElement.id, selectedElement.type, { image: selectedImage, sound });
    }
  };

  // Handle clearing the selected image
  const handleClearImage = () => {
    setSelectedImage(null); // Set the selected image to null
    if (selectedElement) {
      // remove image asset
      updateElementAsset(selectedElement.id, selectedElement.type, { image: null, sound: selectedSound });
    }
  };

  // Toggle the Allow Partial Firing checkbox
  const handleAllowPartialFiringChange = (e) => {
    const isChecked  = e.target.checked; //bool value of checkbox
    if (allowPartialFiring !== isChecked) {
    setAllowPartialFiring(isChecked); //update checkbox
    if (selectedElement) {
      // Update the elements partialFiring property
      updateElementAsset(selectedElement.id, selectedElement.type, { allowPartialFiring: isChecked });
    }}
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
                onClick={() => handleImageSelect(image)} // When an image is clicked, select it
              />
            ))}
          </div>
          <button onClick={() => setIsImageSelectorOpen(false)} style={{ marginTop: "10px" }}>
            Close
          </button>
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
            checked={allowPartialFiring}
            onChange={handleAllowPartialFiringChange} // Handle checkbox change
          />
        </label>
      )}
    </div>
  );
};

export default Properties;
