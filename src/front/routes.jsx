import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Ranking } from "./pages/Ranking";
import { Matches } from "./pages/Matches";
import { UploadResult } from "./pages/UploadResult";
import { Rules } from "./pages/Rules";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import { Admin } from "./pages/admin/Admin";
import { AdminPlayers } from "./pages/admin/AdminPlayers";
import { AdminMatches } from "./pages/admin/AdminMatches";
import { AdminRules } from "./pages/admin/AdminRules";
import { AdminOpenMatches } from "./pages/AdminOpenMatches";
import { OpenMatches } from "./pages/OpenMatches";

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  try {
    if (storedUser && storedUser !== "undefined") {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error leyendo user de localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
  }

  return null;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      <Route index element={<Home />} />

      <Route path="register" element={<Register />} />
      <Route path="login" element={<Login />} />

      <Route
        path="ranking"
        element={
          <ProtectedRoute>
            <Ranking />
          </ProtectedRoute>
        }
      />

      <Route
        path="matches"
        element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        }
      />

      <Route
        path="rules"
        element={
          <ProtectedRoute>
            <Rules />
          </ProtectedRoute>
        }
      />

      <Route
        path="upload-result"
        element={
          <ProtectedRoute>
            <UploadResult />
          </ProtectedRoute>
        }
      />
<Route
  path="notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>
      <Route
        path="profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      <Route
        path="admin/players"
        element={
          <AdminRoute>
            <AdminPlayers />
          </AdminRoute>
        }
      />

      <Route
        path="admin/matches"
        element={
          <AdminRoute>
            <AdminMatches />
          </AdminRoute>
        }
      />

      <Route
        path="admin/rules"
        element={
          <AdminRoute>
            <AdminRules />
          </AdminRoute>
        }
      />
      <Route
  path="/open-matches"
  element={
    <ProtectedRoute>
      <OpenMatches />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/open-matches"
  element={
    <ProtectedRoute>
      <AdminOpenMatches />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);