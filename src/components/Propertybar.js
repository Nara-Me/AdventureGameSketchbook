import React, { useState, useEffect } from "react";

const Properties = ({ selectedElement, updateElementAsset }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const images = [
    { type: "image", src: "./assets/imgs/objects/door.png" },
    { type: "image", src: "./assets/imgs/objects/RPG_key.png" },
  ];

  const sounds = [
    { type: "audio", src: "./assets/audio/yippee-tbh-creature-jazz.mp3" },
  ];

  //update when the selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      setSelectedImage(selectedElement.asset?.image || null);
      setSelectedSound(selectedElement.asset?.sound || null);
    }
  }, [selectedElement]);

    // Only show property bar if element is selected
    if (!selectedElement) {
      return null;
    }

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    if (selectedElement) {
      updateElementAsset(selectedElement.id, selectedElement.type, { image, sound: selectedSound });
    }
    setIsImageSelectorOpen(false); //Close selector
  };

  const handleSoundChange = (e) => {
    const sound = sounds.find((s) => s.src === e.target.value);
    setSelectedSound(sound);
    if (selectedElement) {
      updateElementAsset(selectedElement.id, selectedElement.type, { image: selectedImage, sound });
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (selectedElement) {
      updateElementAsset(selectedElement.id, selectedElement.type, { image: null, sound: selectedSound });
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
            {images.map((image, index) => (
              <img
                key={index}
                src={image.src}
                alt={`${index}`}
                width={50}
                height={50}
                style={{ cursor: "pointer", border: selectedImage?.src === image.src ? "2px solid blue" : "1px solid gray" }}
                onClick={() => handleImageSelect(image)}
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
          {sounds.map((sound, index) => (
            <option key={index} value={sound.src}>
              {sound.src}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default Properties;