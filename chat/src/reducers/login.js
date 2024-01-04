import {
    INVALID_PASSWORD,
    UNEXPECTED_ERROR,
    THROW_ERROR,
    LOGOUT,
} from "../constants/Constants";
import api from "../services/api";
import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";

const initialState = {
    loading: false,
    error: null,
    user: null,
    token: null,
};

export const logoutUser = createAction("LOGOUT_USER");

logoutUser({
    type: LOGOUT,
});

export const userLogin = createAsyncThunk(
    "login/userLoginApi",
    (arg, { getState }) => {
        const { user } = getState().login;
        if (!user && arg.length !== 0) {
            return api
                .fetch("/auth", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify(arg),
                })
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw THROW_ERROR;
                    }
                })
                .then((data) => {
                    window.localStorage.setItem("token", data.token);
                    return data;
                })
                .catch((error) => {
                    const errorMSg =
                        error === THROW_ERROR
                            ? INVALID_PASSWORD
                            : UNEXPECTED_ERROR + error;
                    throw errorMSg;
                });
        } else {
            throw THROW_ERROR;
        }
    }
);

const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        resetError: (state, action) => {
            state.error = action.payload;
        },
        setUserToken: (state, action) => {
            state.user = action.payload;
        },
    },
    extraReducers: {
        [userLogin.pending]: (state) => {
            state.loading = true;
        },
        [userLogin.fulfilled]: (state, action) => {
            state.user = action.payload;
            state.loading = false;
        },
        [userLogin.rejected]: (state, action) => {
            state.error = action.error.message;
            state.loading = false;
        },
    },
});

export const { resetError, setUserToken } = loginSlice.actions;
export default loginSlice.reducer;
