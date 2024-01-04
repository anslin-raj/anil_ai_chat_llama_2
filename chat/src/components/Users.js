import React, { useState, useEffect } from "react";
import { Button, Modal, Table, Form, Collapse } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Field, ErrorMessage } from "formik";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import CircularProgress from "@mui/material/CircularProgress";

import { RegisterUserSchema } from "../constants/validationSchema";
import { getUsers, addUser, removeUser } from "../reducers/users";
import bgImage from "../images/user_backround.jpg";

import "./users.css";

const Users = ({ show, handleClose }) => {
    const dispatch = useDispatch();
    const {
        user_list,
        new_user,
        users_loading,
        removed_user,
        remove_user_loading,
        auth_user,
        add_user_loading,
    } = useSelector((state) => state.users);

    const [open, setOpen] = useState(false);
    const [isTriggered, setIsTriggered] = useState(false);

    useEffect(() => {
        if (auth_user !== null && auth_user?.role === "admin" && !isTriggered) {
			setIsTriggered(true);
            dispatch(getUsers());
        }
    }, [auth_user]);

	useEffect(() => {
        if (auth_user !== null && auth_user?.role === "admin" && isTriggered) {
            dispatch(getUsers());
        }
    }, [new_user, removed_user]);

    const handleDeleteUser = (user_name) => {
        dispatch(removeUser({ user_name: user_name }));
        setOpen(false);
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Users</Modal.Title>
            </Modal.Header>
            <Modal.Body
                className="modal-body"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                }}
            >
                <div className="formButtonsDiv">
                    <Button
                        className="submitButton"
                        onClick={() => setOpen(!open)}
                        aria-controls="example-collapse-text"
                        aria-expanded={open}
                    >
                        Add User <PersonAddAltOutlinedIcon />
                    </Button>
                </div>
                <Collapse in={open}>
                    <div
                        id="example-collapse-text"
                        className="exampleCollapseText"
                    >
                        <Formik
                            initialValues={{
                                name: "",
                                user_name: "",
                                password: "",
                                confirmPassword: "",
                            }}
                            validationSchema={RegisterUserSchema}
                            onSubmit={(
                                values,
                                { setSubmitting, resetForm }
                            ) => {
                                setSubmitting(true);
                                dispatch(
                                    addUser({
                                        user_name: values.user_name,
                                        name: values.name,
                                        role: "user",
                                        password: values.password,
                                    })
                                );
                                resetForm();
                                setSubmitting(false);
                                setOpen(false);
                            }}
                        >
                            {({
                                handleSubmit,
                                isSubmitting,
                                resetForm,
                                isValid,
                            }) => (
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Full Name</Form.Label>
                                        <Field
                                            type="text"
                                            name="name"
                                            as={Form.Control}
                                            placeholder="Enter full name"
                                        />
                                        <ErrorMessage
                                            name="name"
                                            component="div"
                                            style={{ color: "red" }}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>User Name</Form.Label>
                                        <Field
                                            type="text"
                                            name="user_name"
                                            as={Form.Control}
                                            placeholder="Enter user name"
                                        />
                                        <ErrorMessage
                                            name="user_name"
                                            component="div"
                                            style={{ color: "red" }}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <Field
                                            type="password"
                                            name="password"
                                            as={Form.Control}
                                            placeholder="Password"
                                        />
                                        <ErrorMessage
                                            name="password"
                                            component="div"
                                            style={{ color: "red" }}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Confirm Password
                                        </Form.Label>
                                        <Field
                                            type="password"
                                            name="confirmPassword"
                                            as={Form.Control}
                                            placeholder="Confirm Password"
                                        />
                                        <ErrorMessage
                                            name="confirmPassword"
                                            component="div"
                                            style={{ color: "red" }}
                                        />
                                    </Form.Group>
                                    <div className="formButtonsDiv">
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                setOpen(false);
                                                resetForm();
                                            }}
                                            disabled={isSubmitting}
                                            style={{ textAlign: "right" }}
                                            className="mb-3 cancelButton"
                                        >
                                            Close <CancelOutlinedIcon />
                                        </Button>
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={isSubmitting || !isValid}
                                            style={{ textAlign: "right" }}
                                            className="mb-3 submitButton"
                                        >
                                            <div className="submitButtonText">
                                                Submit
                                            </div>{" "}
                                            {isSubmitting ? (
                                                <div className="CircularProgress">
                                                    <CircularProgress size="1.2rem" />
                                                </div>
                                            ) : (
                                                <BackupOutlinedIcon />
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </Collapse>
                <Table striped bordered hover className="usersTable">
                    <thead>
                        <tr>
                            <th className="usersTh">
                                <div className="usersThIdDiv">#</div>
                            </th>
                            <th className="usersTh userTdName">
                                <div className="userTdNameDiv">Name</div>
                                <div
                                    className="tableCircularProgress"
                                    disabled={true}
                                >
                                    {(users_loading ||
                                        remove_user_loading ||
                                        add_user_loading) && (
                                        <CircularProgress size="1.2rem" />
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {user_list.length === 0 && (
                            <tr key={1}>
                                <td className="usersTd">
                                    <div className="usersTdIdDiv">{"~"}</div>
                                </td>
                                <td className="usersTd userTdName">
                                    <div className="userTdNameDiv">
                                        It seems the user table is empty.
                                    </div>
                                    <IconButton
                                        aria-label="delete"
                                        color="primary"
                                        disabled={true}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </td>
                            </tr>
                        )}
                        {user_list.map((user_obj, index) => (
                            <tr key={index}>
                                <td className="usersTd">
                                    <div className="usersTdIdDiv">
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="usersTd userTdName">
                                    <div className="userTdNameDiv">
                                        {user_obj.name}
                                    </div>
                                    <IconButton
                                        aria-label="delete"
                                        color="primary"
                                        onClick={() =>
                                            handleDeleteUser(user_obj.user_name)
                                        }
                                        disabled={
                                            users_loading ||
                                            remove_user_loading ||
                                            add_user_loading
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
};

export default Users;
