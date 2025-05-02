import React, { useEffect } from 'react';
import { Squircle } from 'corner-smoothing';
import './SquircleImage.css';

export default function SquircleImage({
  src,
  onLoad,
  className = '',
  cornerRadius = 100,
  borderWidth = 6,
  ...rest
}: any) {

  // preload the image so we can fire onLoad
  useEffect(() => {
    if (!src || !onLoad) return;
    const img = new Image();
    img.src = src;
    img.onload = onLoad;
  }, [src, onLoad]);

  return (
    <Squircle
      as="div"
      cornerRadius={cornerRadius}
      borderWidth={borderWidth}
      className={`squircle-image-wrapper ${className}`}
      style={{ '--image-url': `url(${src})` }}
      {...rest}
    />
  );
}
