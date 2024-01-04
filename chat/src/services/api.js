import { API_URL } from "../constants/Config";

export default {
    fetch: (url, config) => fetch(`${API_URL}${url}`, config),
};
