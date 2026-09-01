"use client";

import React from "react";
import "./Header.css";
import HeaderLinks from "../HeaderLinks";
import Squircle from "../Squircle";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import ThemeButton from "../ThemeButton";

const title = "E.H.K.";
const links = ["About", "Schedule"];
const drawerWidth = 240;
const breakpoint = 800;

export default function Header() {
  const theme = useTheme();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);

  const handleDrawerButtonClick = (index: number) => {
    handleDrawerToggle();
    router.push(index % 2 === 0 ? "/" : "/schedule");
  };

  const drawer = (
    <div>
      <Box
        sx={(t) => ({
          display: "flex",
          alignItems: "center",
          px: 2,
          ...t.mixins.toolbar,
          justifyContent: "flex-start",
          height: "var(--header-height)",
        })}
      >
        <Link href="/">
          <h4 className="main-heading">{title}</h4>
        </Link>
      </Box>

      <Divider sx={{ backgroundColor: "var(--divider-color)" }} />
      <List>
        {links.map((text, index) => (
          <ListItemButton
            key={text}
            onClick={() => handleDrawerButtonClick(index)}
          >
            <ListItemIcon sx={{ color: "var(--large-heading-color)" }}>
              {index % 2 === 0 ? <InfoIcon /> : <CalendarTodayIcon />}
            </ListItemIcon>
            <ListItemText
              primary={text}
              sx={{ color: "var(--large-heading-color)" }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ backgroundColor: "var(--divider-color)" }} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          position: "fixed",
          bottom: 0,
          width: drawerWidth,
          pb: "16px",
        }}
      >
        <ThemeButton />
      </Box>
    </div>
  );

  return (
    <Squircle className="header-container">
      <Link href="/" className="main-heading-link">
        <h4 className="main-heading">{title}</h4>
      </Link>
      <div className="links-container">
        <HeaderLinks />
      </div>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={(t) => ({
          [t.breakpoints.up(breakpoint)]: { display: "none" },
          color: "var(--large-heading-color)",
          height: "22px",
          width: "22px",
        })}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary"
        anchor={theme.direction === "rtl" ? "right" : "left"}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: drawerWidth,
              backgroundColor: "var(--background-overlay)",
            },
          },
        }}
      >
        {drawer}
      </Drawer>
    </Squircle>
  );
}
