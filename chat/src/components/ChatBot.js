import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Box } from "@mui/material";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CommentIcon from "@mui/icons-material/Comment";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useDispatch, useSelector } from "react-redux";
import { Navbar, Nav, Container } from "react-bootstrap";
import { logoutUser } from "../reducers/login";
import { SSE } from "sse";
import { useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import SendIcon from "@mui/icons-material/Send";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import useMediaQuery from '@mui/material/useMediaQuery';

import {
    ENTER,
    SEARCH_INPUT_PLACEHOLDER,
    MODEL_CLICKAWAY,
	EMPTY_QUSTION_INPUT_FIELD,
} from "../constants/Constants";
import { API_URL } from "../constants/Config";

import Users from "./Users";
import UserIconButton from "./UserIconButton";

import bgImage from "../images/home_backround.jpg";
import pngLogo from "../images/logo.png";
import iconLogo from "../images/icon.jpg";

import { getAuthUsers } from "../reducers/users";

import "./style.css";

const theme = createTheme({
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: "40px",
                    color: "#dcdcdc",
                    border: "2px solid #2e346f",
                    height: "44px",
                    backgroundColor: "rgba(249, 249, 249, 0.089)",
                    backdropFilter: "blur(8px)",
                    "&.Mui-focused": {
                        color: "white",
                        marginTop: "0px",
                        borderColor: "#2e346f",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2e346f",
                    },
                },
                notchedOutline: {
                    border: "2px solid #2e346f",
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: "#dcdcdc",
                    marginTop: "-6px",
                    "&.Mui-focused": {
                        color: "white",
                        marginTop: "0px",
                    },
                    "&.Mui-disabled": {
                        color: "white",
                        marginTop: "0px",
                    },
                },
                notchedOutline: {},
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    justifyContent: "space-between",
                    fontSize: "14px",
                    borderRadius: "40px",
                    height: "40px",
                    border: "2px solid #2e346f",
                    color: "white",
                    backgroundColor: "rgba(249, 249, 249, 0.089)",
                    backdropFilter: "blur(8px)",
                    "&.Mui-disabled": {
                        color: "#a7b3ff",
                        border: "2px solid #2e346f",
                    },
                    "&.MuiButton-outlined.MuiButton-outlined:hover": {
                        color: "#a7b3ff",
                        border: "2px solid #2e346f",
                    },
                },
            },
        },
        MuiSnackbar: {
            styleOverrides: {
                root: {
                    "& .MuiPaper-root.MuiAlert-root": {
                        backgroundColor: "#edeefd75 !important",
                        backdropFilter: "blur(4px) !important",
                        WebkitBackdropFilter: "blur(4px) !important",
                        borderRadius: "40px !important",
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    backgroundColor: "#edeefd75 !important",
                    backdropFilter: "blur(4px) !important",
                    WebkitBackdropFilter: "blur(4px) !important",
                    borderRadius: "40px !important",
                    position: "static",
                    zIndex: 1500,
                },
            },
        },
    },
});

const ChatBot = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.login);
    const { new_user, removed_user, auth_user, error } = useSelector(
        (state) => state.users
    );

    const [chatList, setChatList] = useState([]);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("success");

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState("");
    const [response, setResponse] = useState("");
    const [showUsers, setShowUsers] = useState(false);

    const resultRef = useRef();
    const messagesContainerRef = useRef(null);
	const isMobile = useMediaQuery('(max-width:600px)');
    let receivedStreamList = [];
    let source = null;

    const handleClose = (event, reason) => {
        if (reason === MODEL_CLICKAWAY) {
            return;
        }
        setOpen(false);
    };

    const isScrollbarNearBottom = () => {
        const { scrollTop, scrollHeight, clientHeight } =
            messagesContainerRef.current;
        const threshold = 150;
        return scrollTop + clientHeight >= scrollHeight - threshold;
    };

    const isScrollbarAtBottom = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            return scrollHeight - scrollTop === clientHeight;
        }
        return false;
    };

    const scrollToBottom = () => {
        if (isScrollbarNearBottom()) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    };
    const initialScrollToBottom = () => {
        if (!isScrollbarNearBottom()) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    };
    let isTriggered = false;
    useEffect(() => {
        if (!isTriggered && user && auth_user === null) {
            isTriggered = true;
            dispatch(getAuthUsers());
        }
    }, [user]);

    useEffect(() => {
        if (isScrollbarNearBottom() && !isScrollbarAtBottom()) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [response]);

    useEffect(() => {
        if (result !== "") {
            resultRef.current = result;
        }
    }, [result]);

    useEffect(() => {
        if (new_user !== "") {
            setErrorMessage(new_user);
            setAlertSeverity("success");
            setOpen(true);
        }
    }, [new_user]);

    useEffect(() => {
        if (removed_user !== "") {
            setErrorMessage(removed_user);
            setAlertSeverity("success");
            setOpen(true);
        }
    }, [removed_user]);

    useEffect(() => {
        if (error !== "") {
            setErrorMessage(`Caused error ${error}!`);
            setAlertSeverity("success");
            setOpen(true);
        }
    }, [error]);

    useEffect(() => {
        window.addEventListener("beforeunload", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    const handleSubmitPromptBtnClicked = async (prompt) => {
        if (prompt !== "") {
            setIsLoading(true);
            setResult("");
            let url = `${API_URL}/chat_stream`;
            let data = {
                prompt: prompt,
                chat: [],
            };
            let source = new SSE(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                method: "POST",
                payload: JSON.stringify(data),
            });

            initialScrollToBottom();
            source.addEventListener("message", (e) => {
                if (e.data !== "[DONE]") {
                    scrollToBottom();
                    receivedStreamList.push(e.data);
                    const sentence = receivedStreamList
                        .filter((word) => word !== "")
                        .join(" ")
                        .replace("<s>", "")
                        .replace("</s>", "");
                    setResponse(sentence);
                } else {
                    source.close();
                    const sentence = receivedStreamList
                        .filter((word) => word !== "")
                        .join(" ")
                        .replace("<s>", "")
                        .replace("</s>", "");
                    setChatList([
                        ...chatList,
                        { response: sentence, query: prompt, drug_details: [] },
                    ]);
                    setQuery("");
                    setResponse("");
                }
            });
            source.addEventListener("readystatechange", (e) => {
                if (e.readyState >= 2) {
                    setIsLoading(false);
                }
            });
            source.stream();
        } else {
            setErrorMessage(EMPTY_QUSTION_INPUT_FIELD);
            setAlertSeverity("error");
            setOpen(true);
        }
    };

    const handleUnload = (e) => {
        e.preventDefault();
        if (source) {
            source.close();
        }
    };

    const logout = () => {
        dispatch(logoutUser());
        window.localStorage.clear();
    };

    return (
        <div className="boxBody">
            <Navbar
                bg="dark"
                variant="dark"
                id="navbar"
                collapseOnSelect
                sticky="top"
            >
                <Container>
                    <Navbar.Brand>
                        <img
                            alt="Anil"
                            src={iconLogo}
                            height="35"
                            className="d-inline-block align-top iconImg"
                        />
                        <img
                            alt="AI"
                            src={pngLogo}
                            height="35"
                            className="d-inline-block align-top"
                        />{" "}
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="responsive-navbar-nav">
                        <Nav className="me-auto "></Nav>
                        <Nav>
                            {auth_user?.role === "admin" && (
                                <Nav.Link
                                    eventKey={1}
                                    active={false}
                                    onClick={() => setShowUsers(true)}
                                >
                                    Users
                                </Nav.Link>
                            )}
                            <UserIconButton
                                name={auth_user?.name}
                                logout={logout}
                            />
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Box
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                flexDirection={"column"}
                className="boxBody"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                }}
            >
                <Box className="chatWrap" ref={messagesContainerRef}>
                    {chatList.map((obj, i) => {
                        return (
                            <Box
                                key={i}
                                display={"flex"}
                                flexDirection={"column"}
                            >
                                <Box className="messageTitle messageBox3">
                                    <CommentIcon className="commentIcon" />
                                    {obj.query}
                                </Box>
                                <Box className="messageBox3">
                                    {obj.response &&
                                        obj.response
                                            .split("```")
                                            .map((item, index) => {
                                                if (index % 2 === 0) {
                                                    return (
                                                        <div key={index}>
                                                            {item
                                                                .split(
                                                                    "<br> <br>"
                                                                )
                                                                .map(
                                                                    (
                                                                        i,
                                                                        index
                                                                    ) => {
                                                                        return i
                                                                            .split(
                                                                                "<br>"
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    ii,
                                                                                    index
                                                                                ) => {
                                                                                    return (
                                                                                        <Box
                                                                                            className="messageText"
                                                                                            key={
                                                                                                index
                                                                                            }
                                                                                        >
                                                                                            {`${ii}\n`}
                                                                                        </Box>
                                                                                    );
                                                                                }
                                                                            );
                                                                    }
                                                                )}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <SyntaxHighlighter
                                                            language="python"
                                                            style={okaidia}
                                                            key={index}
                                                        >
                                                            {item
                                                                .split("<br>")
                                                                .slice(1, -1)
                                                                .map(
                                                                    (
                                                                        j,
                                                                        index
                                                                    ) =>
                                                                        `${j}\n`
                                                                )
                                                                .join("")}
                                                        </SyntaxHighlighter>
                                                    );
                                                }
                                            })}
                                </Box>
                            </Box>
                        );
                    })}
                    {isLoading && (
                        <Box display={"flex"} flexDirection={"column"}>
                            <Box className="messageTitle messageBox3">
                                <CommentIcon className="commentIcon" />
                                {query}
                            </Box>
                            <Box className="messageBox3">
                                {response === "" && (
                                    // <div>
                                    <Box
                                        className="messageText"
                                        style={{ minWidth: "100%" }}
                                    >
                                        <Skeleton
                                            className="loader loaderFirst"
                                            animation="wave"
                                        />
                                        <Skeleton
                                            className="loader loaderSecod"
                                            animation="wave"
                                        />
                                        <Skeleton
                                            className="loader loaderThird"
                                            animation="wave"
                                        />
                                    </Box>
                                )}
                                {response &&
                                    response.split("```").map((item, index) => {
                                        if (index % 2 === 0) {
                                            return (
                                                <div key={index}>
                                                    {item
                                                        .split("<br> <br>")
                                                        .map((i, index) => {
                                                            return i
                                                                .split("<br>")
                                                                .map(
                                                                    (
                                                                        ii,
                                                                        index
                                                                    ) => {
                                                                        return (
                                                                            <Box
                                                                                className="messageText"
                                                                                key={
                                                                                    index
                                                                                }
                                                                            >
                                                                                {`${ii}\n`}
                                                                            </Box>
                                                                        );
                                                                    }
                                                                );
                                                        })}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <SyntaxHighlighter
                                                    language="python"
                                                    style={okaidia}
                                                    key={index}
                                                >
                                                    {item
                                                        .split("<br>")
                                                        .slice(1, -1)
                                                        .map(
                                                            (j, index) =>
                                                                `${j}\n`
                                                        )
                                                        .join("")}
                                                </SyntaxHighlighter>
                                            );
                                        }
                                    })}
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    bgcolor: "background.paper",
                                    borderRadius: 1,
                                }}
                            ></Box>
                        </Box>
                    )}
                </Box>
                <Box
                    minWidth={"83%"}
                    maxWidth={"75vw"}
                    maxHeight={"30px"}
                    className="bottemDiv"
                >
                    <ThemeProvider theme={theme}>
                        <TextField
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            id="input"
                            label={SEARCH_INPUT_PLACEHOLDER}
                            variant="outlined"
                            className="bottemDivInput"
                            disabled={isLoading}
                            sx={{
                                "& .MuiInputBase-input.Mui-disabled": {
                                    WebkitTextFillColor: "#a7b3ff",
                                },
                            }}
                            onKeyPress={(e) => {
                                if (e.key === ENTER) {
                                    handleSubmitPromptBtnClicked(
                                        e.target.value
                                    );
                                }
                            }}
                        />
                    </ThemeProvider>
                    <Box className="bottemDivButton">
                        <ThemeProvider theme={theme}>
                            <Button
                                variant="outlined"
                                disabled={isLoading}
                                endIcon={<SendIcon />}
                                onClick={() =>
                                    handleSubmitPromptBtnClicked(query)
                                }
                            >
                              {!isMobile && "Send"}
                            </Button>
                        </ThemeProvider>
                    </Box>
                </Box>
            </Box>
            <Users show={showUsers} handleClose={() => setShowUsers(false)} />
            {ReactDOM.createPortal(
                <ThemeProvider theme={theme}>
                    <Snackbar
                        open={open}
                        autoHideDuration={6000}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "right",
                        }}
                        style={{ zIndex: 20000 }}
                    >
                        <MuiAlert
                            onClose={handleClose}
                            severity={alertSeverity}
                            sx={{
                                width: "100%",
                            }}
                        >
                            {errorMessage}
                        </MuiAlert>
                    </Snackbar>
                </ThemeProvider>,
                document.body
            )}
        </div>
    );
};

export default ChatBot;
