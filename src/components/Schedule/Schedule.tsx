import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InlineWidget } from 'react-calendly';
import './Schedule.css';
import { CALENDLY } from '../../constants';

function Schedule() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'EDIT_IMAGE_LOADED', payload: true });
  });
  return (
    <div className="schedule-container">
      <InlineWidget url={CALENDLY} styles={{ height: '100%' }} />
    </div>
  );
}

export default Schedule;
