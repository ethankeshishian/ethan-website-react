"use client";

import { useDispatch, useSelector } from "react-redux";
import { ConfigProvider, Switch } from "antd";
import { RootState } from "../../redux/reducers";
import { MoonIcon } from "../icons/MoonIcon";
import { SunIcon } from "../icons/SunIcon";

export default function ThemeButton() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(
    (state: RootState) => state.colorTheme.darkMode
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Switch: {
            trackHeight: 22,
            trackMinWidth: 44,
            trackPadding: 2,
            handleSize: 18,
            colorPrimary: "#1890ff",
            colorPrimaryHover: "#1890ff",
          },
        },
      }}
    >
      <Switch
        className="theme-switch"
        checked={isDarkMode}
        checkedChildren={<MoonIcon className="theme-svg" />}
        unCheckedChildren={<SunIcon className="theme-svg" />}
        onChange={() => dispatch({ type: "TOGGLE_DARK_MODE" })}
      />
      <style jsx global>{`
        .theme-svg {
          fill: var(--background-color);
          height: 22px;
          width: 22px;
        }
        .theme-switch.ant-switch,
        .theme-switch.ant-switch:hover,
        .theme-switch.ant-switch-checked,
        .theme-switch.ant-switch-checked:hover {
          background-color: var(--large-heading-color) !important;
        }
        .theme-switch .ant-switch-handle::before {
          background-color: var(--background-color) !important;
        }
      `}</style>
    </ConfigProvider>
  );
}
