import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DoorFrontOutlinedIcon from "@mui/icons-material/DoorFrontOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { deepPurple } from "@mui/material/colors";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import { Button, Collapse } from "react-bootstrap";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import GitHubIcon from "@mui/icons-material/GitHub";
import ImageIcon from "@mui/icons-material/Image";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import pngLogo from "../images/logo.png";

import "./users.css";

const theme = createTheme({
    components: {
        MuiDivider: {
            styleOverrides: {
                root: {
                    "&::before, &::after": {
                        borderTop:
                            "thin solid rgb(255 255 255 / 24%) !important",
                    },
                },
                wrapper: {
                    color: "white",
                },
            },
        },
    },
});

const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
        backgroundColor: "#44b700",
        color: "#44b700",
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        "&::after": {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            animation: "ripple 1.2s infinite ease-in-out",
            border: "1px solid currentColor",
            content: '""',
        },
    },
    // Note: This keyframe animation might have a higher GPU utilization.
    // "@keyframes ripple": {
    //     "0%": {
    //         transform: "scale(.8)",
    //         opacity: 1,
    //     },
    //     "100%": {
    //         transform: "scale(2.4)",
    //         opacity: 0,
    //     },
    // },
}));

const UserIconButton = ({ name, logout }) => {
    const [open, setOpen] = useState(false);
    const [collapseOpen, setCollapseOpen] = useState(false);

    const handleClick = () => {
        setOpen(!open);
    };

    const handleClose = () => {
        setOpen(false);
        setCollapseOpen(false);
    };

    return (
        <>
            <IconButton color="filled" onClick={() => handleClick()}>
                <AccountCircleOutlinedIcon style={{ color: "grey" }} />
            </IconButton>
            {open && (
                <ClickAwayListener onClickAway={() => handleClose()}>
                    <div className="user-component">
                        <div className="user-icon-row">
                            <StyledBadge
                                overlap="circular"
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                variant="dot"
                            >
                                <Avatar sx={{ bgcolor: deepPurple[500] }}>
                                    {name?.split(" ")[0][0]}
                                    {name?.split(" ").length !== 1
                                        ? name?.split(" ")[1][0]
                                        : ""}
                                </Avatar>
                            </StyledBadge>
                        </div>
                        <div className="user-info-row">
                            <span>Hi, {name}</span>
                        </div>
                        <div className="user-actions-row">
                            <Button
                                variant="primary"
                                onClick={() => setCollapseOpen(!collapseOpen)}
                                className="mb-3 user-actions-button"
                            >
                                <div className="user-actions-button-elements">
                                    <div className="user-actions-button-elements-text">
                                        About
                                    </div>
                                    <div className="user-actions-button-elements-about">
                                        {collapseOpen ? (
                                            <KeyboardArrowUpOutlinedIcon className="user-actions-button-elements-icon" />
                                        ) : (
                                            <KeyboardArrowDownOutlinedIcon className="user-actions-button-elements-icon" />
                                        )}
                                    </div>
                                </div>
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => logout()}
                                className="mb-3 user-actions-button"
                            >
                                <div className="user-actions-button-elements">
                                    <div className="user-actions-button-elements-text">
                                        Log out
                                    </div>
                                    <div className="user-actions-button-elements-logout">
                                        <DoorFrontOutlinedIcon className="user-actions-button-elements-icon" />
                                    </div>
                                </div>
                            </Button>
                        </div>
                        <Collapse in={collapseOpen}>
                            <div>
                                <ThemeProvider theme={theme}>
                                    <Divider variant="middle">About</Divider>
                                </ThemeProvider>
                                <div className="about-info-column">
                                    <div className="about-info-column-logo-div">
                                        <img
                                            className="about-info-column-logo"
                                            src={pngLogo}
                                            alt="Logo"
                                        />
                                    </div>
                                    <div className="about-info-row">
                                        <IconButton
                                            target="_blank"
                                            color="inherit"
                                            className="aboutLink"
                                            href="https://github.com/anslin-raj"
                                        >
                                            <GitHubIcon />
                                        </IconButton>
                                        <IconButton
                                            target="_blank"
                                            color="inherit"
                                            className="aboutLink"
                                            href="https://www.linkedin.com/in/anslin-raj-i-a20a811b0"
                                        >
                                            <LinkedInIcon />
                                        </IconButton>
                                        <IconButton
                                            target="_blank"
                                            color="inherit"
                                            className="aboutLink"
                                            href="https://www.instagram.com/_art_artworld_"
                                        >
                                            <InstagramIcon />
                                        </IconButton>
                                        <IconButton
                                            target="_blank"
                                            color="inherit"
                                            className="aboutLink"
                                            href="https://www.freepik.com/free-vector/geometric-shapes-background_6849714.htm"
                                        >
                                            <ImageIcon />
                                        </IconButton>
                                    </div>
                                </div>
                                <p className="about-info-column-p">
                                    Copyright © 2023 Anslin Raj | Anil AI. All
                                    rights reserved.
                                </p>
                            </div>
                        </Collapse>
                    </div>
                </ClickAwayListener>
            )}
        </>
    );
};

export default UserIconButton;
