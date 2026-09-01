"use client";
import React from 'react';
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
