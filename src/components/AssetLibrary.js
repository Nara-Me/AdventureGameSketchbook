// background art by Nauris @Namatnieks on Twitter

import React from "react";

const AssetLibrary = ({
  userImages, userAudios, userBackgrounds,
  handleImageUpload, handleAudioUpload, handleBackgroundsUpload,
  availableImages, availableSounds, availableBackgrounds,
  onSelectImage, onSelectAudio, onSelectBackground,
  showImages = false, showAudios = false, showBackgrounds = false,
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
        </div>
        {/*<input type="file" accept="image/*" multiple onChange={handleImageUpload} />*/}
        <label className="asset-upload-btn">
          ＋
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        </label>
      </>
    )}
    {showBackgrounds && (
      <>
        <div className="asset-library-images">
          {availableBackgrounds.map((bg, i) => (
            <img key={i} src={bg.src} alt={bg.name || "bg"} className="asset-library-image"
              onClick={() => onSelectBackground(bg)}
            />
          ))}
        </div>
        <label className="asset-upload-btn">
          ＋
          <input type="file" accept="image/*" multiple onChange={handleBackgroundsUpload} />
        </label>
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
          {/*userAudios.map((aud, i) => (
            <div key={i} className="asset-library-audio-item" onClick={() => onSelectAudio(aud)}>
              <span role="img" aria-label="audio">🔊</span> {aud.name}
            </div>
          ))*/}
        </div>
        {/*<input type="file" accept="audio/*" multiple onChange={handleAudioUpload} />*/}
        <label className="asset-upload-btn">
          ＋
          <input type="file" accept="audio/*" multiple onChange={handleAudioUpload} />
        </label>
      </>
    )}
  </div>
);

export default AssetLibrary;