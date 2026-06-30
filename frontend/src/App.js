import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AdminLayout from "./pages/AdminLayout";
import Reservations from "./pages/Reservations";
import MenuManagement from "./pages/MenuManagement";
import TableManagement from "./pages/TableManagement";
import CategoryManagement from "./pages/CategoryManagement";
import Analytics from "./pages/Analytics";
import CustomerMenu from "./pages/CustomerMenu";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Reservations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;