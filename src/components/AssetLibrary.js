// background art by Nauris @Namatnieks on Twitter

import React from "react";

const AssetLibrary = ({
  userImages, userAudios,
  handleImageUpload, handleAudioUpload,
  availableImages, availableSounds,
  onSelectImage, onSelectAudio,
  showImages = false, showAudios = false,
}) => (
  <div className="asset-library">
    {showImages && ( //only shows the image assets
      <>
        <div className="asset-library-images">
          {availableImages.map((img, i) => (
            <img key={i} src={img.src} alt={img.name || "img"} className="asset-library-image"
              onClick={() => onSelectImage(img)}
            />
          ))}
          {userImages.map((img, i) => (
            <img key={i} src={img.src} alt={img.name} className="asset-library-image"
              onClick={() => onSelectImage(img)}
            />
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
      </>
    )}
    {showAudios && ( //only shows the audio assets
      <>
        <div className="asset-library-audio-list">
          {availableSounds.map((aud, i) => (
            <div key={i} className="asset-library-audio-item" onClick={() => onSelectAudio(aud)}>
              <span role="img" aria-label="audio">🔊</span> {aud.name || aud.src}
            </div>
          ))}
          {userAudios.map((aud, i) => (
            <div key={i} className="asset-library-audio-item" onClick={() => onSelectAudio(aud)}>
              <span role="img" aria-label="audio">🔊</span> {aud.name}
            </div>
          ))}
        </div>
        <input type="file" accept="audio/*" multiple onChange={handleAudioUpload} />
      </>
    )}
  </div>
);

export default AssetLibrary;