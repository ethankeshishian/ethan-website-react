import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InlineWidget } from 'react-calendly';

function Schedule() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'EDIT_IMAGE_LOADED', payload: true });
  });
  return (
    <InlineWidget
      url="https://calendly.com/ethan_k/30min"
      styles={{ height: '100%' }}
    />
  );
}

export default Schedule;
