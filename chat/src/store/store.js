import { configureStore, combineReducers } from "@reduxjs/toolkit";

import login from "../reducers/login";
import users from "../reducers/users";
import { LOGOUT } from "../constants/Constants";

const combinedReducer = combineReducers({
    login: login,
    users: users,
});

const rootReducer = (state, action) => {
    if (action.type === LOGOUT) {
        state = undefined;
    }
    return combinedReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
});
