import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Login from "./Login.jsx";
import TambahTugas from "./componen/TambahTugas.jsx";
import Monitoring from "./componen/Monitoring.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🔒 Komponen pelindung route
function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// 🔄 Komponen redirect otomatis
function AutoRedirect() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  return isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastContainer autoClose={2500} />
      <Routes>
        {/* Arahkan ke halaman sesuai status login */}
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/tambah-tugas" element={<TambahTugas />} />
        <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />

        {/* Redirect default */}
        <Route path="*" element={<AutoRedirect />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
