import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Navbar } from "./components/Navbar.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AdminRoute } from "./components/AdminRoute.jsx";

import { Home } from "./pages/Home.jsx";
import { Register } from "./pages/Register.jsx";
import { Login } from "./pages/Login.jsx";
import { Ranking } from "./pages/Ranking.jsx";
import { Matches } from "./pages/Matches.jsx";
import { UploadResult } from "./pages/UploadResult.jsx";
import { Rules } from "./pages/Rules.jsx";
import { Profile } from "./pages/Profile.jsx";

import { Admin } from "./pages/admin/Admin.jsx";
import { AdminPlayers } from "./pages/admin/AdminPlayers.jsx";
import { AdminMatches } from "./pages/admin/AdminMatches.jsx";
import { AdminRules } from "./pages/admin/AdminRules.jsx";

import "./styles.css";

export const App = () => {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/rules" element={<Rules />} />

          <Route
            path="/upload-result"
            element={
              <ProtectedRoute>
                <UploadResult />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/players"
            element={
              <AdminRoute>
                <AdminPlayers />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/matches"
            element={
              <AdminRoute>
                <AdminMatches />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/rules"
            element={
              <AdminRoute>
                <AdminRules />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
};