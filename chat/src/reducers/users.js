import {
    INVALID_SECRET_URL,
    UNEXPECTED_GETURL_ERROR,
    THROW_ERROR,
} from "../constants/Constants";
import { API_URL } from "../constants/Config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const api = {
    fetch: (url, config) => fetch(`${API_URL}${url}`, config),
};

const initialState = {
    user_list: [],
    users_loading: false,
    add_user_loading: false,
    new_user: "",
    remove_user_loading: false,
    removed_user: "",
    auth_user_loading: false,
    auth_user: null,
    error: "",
};

export const getUsers = createAsyncThunk("users/get", (arg, { getState }) => {
    const { user } = getState()?.login;
    const token = user.token;
    if (token) {
        return api
            .fetch(`/users`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                method: "GET",
                body: JSON.stringify(arg),
            })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.json().then((msg) => {
                        throw msg;
                    });
                }
            })
            .catch((err) => {
                const errorMsg =
                    err === THROW_ERROR
                        ? INVALID_SECRET_URL
                        : UNEXPECTED_GETURL_ERROR + err;
                throw errorMsg;
            });
    }
});

export const addUser = createAsyncThunk("users/add", (arg, { getState }) => {
    const { user } = getState()?.login;
    const token = user.token;
    if (token) {
        return api
            .fetch(`/users`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                method: "POST",
                body: JSON.stringify(arg),
            })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.json().then(() => {
                        throw THROW_ERROR;
                    });
                }
            })
            .catch((err) => {
                const errorMsg =
                    err === THROW_ERROR
                        ? INVALID_SECRET_URL
                        : UNEXPECTED_GETURL_ERROR + err;
                throw errorMsg;
            });
    }
});

export const removeUser = createAsyncThunk(
    "users/remove",
    (arg, { getState }) => {
        const { user } = getState()?.login;
        const token = user.token;
        if (token) {
            return api
                .fetch(`/users/${arg.user_name}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    method: "DELETE",
                })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return response.json().then(() => {
                            throw THROW_ERROR;
                        });
                    }
                })
                .catch((err) => {
                    const errorMsg =
                        err === THROW_ERROR
                            ? INVALID_SECRET_URL
                            : UNEXPECTED_GETURL_ERROR + err;
                    throw errorMsg;
                });
        }
    }
);

export const getAuthUsers = createAsyncThunk(
    "auth_users/get",
    (arg, { getState }) => {
        const { user } = getState()?.login;
        const token = user.token;
        if (token) {
            return api
                .fetch(`/get_auth_user`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    method: "GET",
                    body: JSON.stringify(arg),
                })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        return response.json().then((msg) => {
                            throw msg;
                        });
                    }
                })
                .catch((err) => {
                    const errorMsg =
                        err === THROW_ERROR
                            ? INVALID_SECRET_URL
                            : UNEXPECTED_GETURL_ERROR + err;
                    throw errorMsg;
                });
        }
    }
);

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        resetChat: (state) => {
            state.chat = [];
        },
    },
    extraReducers: {
        [getUsers.pending]: (state) => {
            state.users_loading = true;
        },
        [getUsers.fulfilled]: (state, action) => {
            state.users_loading = false;
            state.user_list = action.payload?.users;
        },
        [getUsers.rejected]: (state, action) => {
            state.users_loading = false;
            state.error = action.payload?.detail;
        },
        [addUser.pending]: (state) => {
            state.add_user_loading = true;
        },
        [addUser.fulfilled]: (state, action) => {
            state.add_user_loading = false;
            state.new_user = action.payload?.message;
        },
        [addUser.rejected]: (state, action) => {
            state.add_user_loading = false;
            state.error = action.payload?.detail;
        },

        [removeUser.pending]: (state) => {
            state.remove_user_loading = true;
        },
        [removeUser.fulfilled]: (state, action) => {
            state.remove_user_loading = false;
            state.removed_user = action.payload?.message;
        },
        [removeUser.rejected]: (state, action) => {
            state.remove_user_loading = false;
            state.error = action.payload?.detail;
        },

        [getAuthUsers.pending]: (state) => {
            state.auth_user_loading = true;
        },
        [getAuthUsers.fulfilled]: (state, action) => {
            state.auth_user_loading = false;
            state.auth_user = action.payload?.auth_user;
        },
        [getAuthUsers.rejected]: (state, action) => {
            state.auth_user_loading = false;
            state.error = action.payload?.detail;
        },
    },
});

export const { resetChat } = usersSlice.actions;
export default usersSlice.reducer;
