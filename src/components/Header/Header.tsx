import React from "react";
import "./Header.css";
import HeaderLinks from "../HeaderLinks";

import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import InfoIcon from "@material-ui/icons/Info";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import MenuIcon from "@material-ui/icons/Menu";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import ThemeButton from "../ThemeButton";
import { useHistory } from "react-router-dom";

const title = "E.H.K.";
const links = ["About", "Schedule"];

function Header(props: any) {
    const { window } = props;
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const history = useHistory();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const handleDrawerButtonClick = (index: number) => {
        handleDrawerToggle();
        const link = index % 2 === 0 ? "/" : "/schedule";
        history.push(link);
    };

    const drawer = (
        <div>
            <div className={classes.toolbar} />
            <div className={classes.drawerHeader}>
                <a href="/" className="">
                    <h4 className="main-heading">{title}</h4>
                </a>
            </div>

            <Divider className={classes.divider} />
            <List>
                {links.map((text, index) => (
                    <ListItem button key={text} onClick={() => handleDrawerButtonClick(index)}>
                        <ListItemIcon className={classes.listButton}>{index % 2 === 0 ? <InfoIcon /> : <CalendarTodayIcon />}</ListItemIcon>
                        <ListItemText primary={text} className={classes.listText} />
                    </ListItem>
                ))}
            </List>
            <Divider className={classes.divider} />
            <div className={classes.themeButtonContainer}>
                <ThemeButton />
            </div>
        </div>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <div className="header-container">
            <a href="/" className="main-heading-link">
                <h4 className="main-heading">{title}</h4>
            </a>
            <div className="links-container">
                <HeaderLinks />
            </div>
            <IconButton color="inherit" aria-label="open drawer" onClick={handleDrawerToggle} className={classes.menuButton}>
                <MenuIcon />
            </IconButton>
            {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
            <Hidden smUp implementation="css">
                <Drawer
                    container={container}
                    variant="temporary"
                    anchor={theme.direction === "rtl" ? "right" : "left"}
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                >
                    {drawer}
                </Drawer>
            </Hidden>
        </div>
    );
}

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    drawer: {
        [theme.breakpoints.up("sm")]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("sm")]: {
            display: "none",
        },
        color: `var(--large-heading-color)`,
        height: "32px",
        width: "32px",
    },
    // necessary for content to be below app bar
    toolbar: {
        // theme.mixins.toolbar,
    },
    drawerPaper: {
        width: drawerWidth,
        backgroundColor: `var(--background-overlay)`,
    },
    // from another example
    drawerHeader: {
        display: "flex",
        alignItems: "center",
        padding: theme.spacing(0, 2),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: "flex-start",
        height: `var(--header-height)`,
    },

    // mine
    listButton: {
        color: `var(--large-heading-color)`,
    },
    listText: {
        color: `var(--large-heading-color)`,
    },
    divider: {
        backgroundColor: `var(--divider-color)`,
    },
    themeButtonContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        position: "fixed",
        bottom: "0",
        width: drawerWidth,
        paddingBottom: "16px",
    },
}));

export default Header;
