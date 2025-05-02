import React from 'react';
import { Squircle as SquircleLib } from 'corner-smoothing';
import './Squircle.css';

export default function Squircle({
  className = '',
  cornerRadius = 100,
  cornerSmoothing = 1,
  borderWidth,
  children,
  ...rest
}: any) {

  return (
    <SquircleLib
      as="div"
      cornerRadius={cornerRadius}
      cornerSmoothing={cornerSmoothing}
      borderWidth={borderWidth}
      className={`squircle-wrapper ${className}`}
      {...rest}
    >
      { children }
    </SquircleLib>
  );
}
