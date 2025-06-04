import React from "react";
import { Image } from "react-konva";
import useImage from "use-image";

const LoadImage = ({ x, y, src, width = 50, height = 50 }) => { // used to load the assets
  const [image] = useImage(src);
  if (!image) return null;

  // Maintain aspect ratio
  const aspectRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = width;
  let drawHeight = height;
  if (aspectRatio > 1) {
    drawHeight = width / aspectRatio;
  } else {
    drawWidth = height * aspectRatio;
  }

  return <Image x={x} y={y} image={image} width={drawWidth} height={drawHeight} />;
};

export default LoadImage;