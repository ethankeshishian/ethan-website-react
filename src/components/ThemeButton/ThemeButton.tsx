import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/reducers';
import { ReactComponent as MoonIcon } from '../../assets/moon.svg';
import { ReactComponent as SunIcon } from '../../assets/sun.svg';
import './ThemeButton.css';
import { Switch } from 'antd';

function ThemeButton() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(
    (state: RootState) => state.colorTheme.darkMode
  );
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      console.log('dark');
    } else {
      document.body.classList.remove('dark-mode');
      console.log('light');
    }
  });
  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  return (
    <>
      <Switch
        className="theme-switch"
        checked={isDarkMode}
        checkedChildren={<MoonIcon className="theme-svg" />}
        unCheckedChildren={<SunIcon className="theme-svg" />}
        onChange={toggleDarkMode}
      />
      <style jsx>{`
        .theme-switch {
          background-color: var(--large-heading-color);
        }
        .ant-switch-handle::before {
          background-color: var(--background-color);
        }
      `}</style>
    </>
  );
}

export default ThemeButton;
