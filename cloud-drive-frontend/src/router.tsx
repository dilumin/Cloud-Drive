import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DriveShell } from './features/drive/pages/DriveShell';
import { RootRedirect } from './features/drive/pages/RootRedirect';
import { FolderPage } from './features/drive/pages/FolderPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { NotFound } from './shared/NotFound';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/drive" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/drive"
        element={
          <ProtectedRoute>
            <DriveShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="folders/:id" element={<FolderPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
