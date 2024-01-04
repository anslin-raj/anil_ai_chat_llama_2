import { useEffect } from "react";
import {
    HashRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import ChatBot from "./components/ChatBot";
import Login from "./components/login";
import { setUserToken } from "../src/reducers/login";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

function App() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.login);
    let isTriggered = false
    useEffect(() => {
      const token = window.localStorage.getItem("token");
      
      if (!isTriggered && token) {
        isTriggered = true
            dispatch(setUserToken({ token: token }));
        }
    }, []);

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route
                        path="/"
                        element={
                            user?.token ? (
                                <Navigate to="/chat" />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/chat"
                        element={<ProtectedRoute user={user} />}
                    />
                    <Route
                        path="/login"
                        element={<NonProtectedRoute user={user} />}
                    />
                </Routes>
            </div>
        </Router>
    );
}

function ProtectedRoute({ user }) {
    return user?.token ? <ChatBot /> : <Navigate to="/login" />;
}

function NonProtectedRoute({ user }) {
    return user?.token ? <Navigate to="/chat" /> : <Login />;
}

export default App;
