import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { Formik } from "formik";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { userLogin, resetError } from "../reducers/login";
import Fingerprint from "@mui/icons-material/Fingerprint";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { LOGIN_SCHEMA } from "../constants/validationSchema";

import bgImage from "../images/login_backround.jpg";
import pngLogo from "../images/logo.png";
import iconLogo from "../images/icon.jpg";

import "./style.css";

const theme = createTheme({
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: "40px",
                    color: "#dcdcdc",
                    border: "2px solid #2e346f",
                    height: "50px",
                    backgroundColor: "rgba(249, 249, 249, 0.089)",
                    "&.Mui-disabled": {
                        opacity: 0.5,
                        color: "white",
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
                    marginTop: "-4px",
                    "&.Mui-focused": {
                        color: "white",
                        marginTop: "0px",
                    },
                    "&.Mui-disabled": {
                        opacity: 0.5,
                        color: "white",
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
                    "&.Mui-disabled": {
                        opacity: 0.5,
                        color: "white",
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

const Login = () => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.login);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (error) {
            setShowAlert(true);
            setAlertMessage(error);
            dispatch(resetError());
        }
    }, [error]);

    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setShowAlert(false);
    };

    return (
        <div
            className="boxBody"
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: "cover",
            }}
        >
            <ThemeProvider theme={theme}>
                <Snackbar
                    open={showAlert}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                    autoHideDuration={4000}
                    onClose={handleClose}
                >
                    <MuiAlert
                        onClose={handleClose}
                        severity={"error"}
                        sx={{ width: "100%" }}
                    >
                        {alertMessage}
                    </MuiAlert>
                </Snackbar>
            </ThemeProvider>
            <div className="loginDiv">
                <div className="loginIconLogoDiv">
                    <img src={iconLogo} className="loginIcon" alt="Anil AI" />
                    <img src={pngLogo} className="loginLogo" alt="Anil AI" />
                </div>
                <Formik
                    validationSchema={LOGIN_SCHEMA}
                    initialValues={{ username: "", password: "" }}
                    onSubmit={(values) => {
                        dispatch(
                            userLogin({
                                user_name: values.username,
                                password: values.password,
                            })
                        );
                    }}
                >
                    {({ errors, handleChange, handleSubmit }) => (
                        <Form
                            onSubmit={handleSubmit}
                            className="loginFormContainer"
                        >
                            <div className="formItems">
                                <Form.Group>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name="username"
                                            error={
                                                errors?.username ? true : false
                                            }
                                            label="Username"
                                            helperText={
                                                errors?.username
                                                    ? errors?.username
                                                    : ""
                                            }
                                            onChange={handleChange}
                                            disabled={loading}
                                            sx={{
                                                "& .MuiInputBase-input.Mui-disabled":
                                                    {
                                                        WebkitTextFillColor:
                                                            "white",
                                                    },
                                            }}
                                        />
                                    </ThemeProvider>
                                </Form.Group>
                                <Form.Group>
                                    <ThemeProvider theme={theme}>
                                        <TextField
                                            name="password"
                                            type="password"
                                            error={
                                                errors?.password ? true : false
                                            }
                                            label="Password"
                                            helperText={
                                                errors?.password
                                                    ? errors?.password
                                                    : ""
                                            }
                                            onChange={handleChange}
                                            disabled={loading}
                                            sx={{
                                                "& .MuiInputBase-input.Mui-disabled":
                                                    {
                                                        WebkitTextFillColor:
                                                            "white",
                                                    },
                                            }}
                                        />
                                    </ThemeProvider>
                                </Form.Group>
                                <ThemeProvider theme={theme}>
                                    <Button
                                        variant="contained"
                                        className="loginButton"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Authenticating…"
                                            : "SIGN IN"}{" "}
                                        <Fingerprint />
                                    </Button>
                                </ThemeProvider>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Login;
