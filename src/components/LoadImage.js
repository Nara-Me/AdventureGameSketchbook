import React from "react";
import { Image } from "react-konva";
import useImage from "use-image";

const LoadImage = ({ x, y, src, width = 100, height = 100, flipX }) => { //used to load the assets in the run mode
  const [image] = useImage(src);
  if (!image) return null;

  //maintain aspect ratio
  const aspectRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = width;
  let drawHeight = height;
  if (aspectRatio > 1) {
    drawHeight = width / aspectRatio;
  } else {
    drawWidth = height * aspectRatio;
  }

  return (
    <Image
      x={x - width / 2} y={y - height / 2} //center image
      image={image}
      width={drawWidth} height={drawHeight}
      scaleX={flipX ? -1 : 1} offsetX={flipX ? width : 0} //flip image and offset position if flip
    />
  );
  //return <Image x={x} y={y - width} image={image} width={width} height={height} />;
};

export default LoadImage;