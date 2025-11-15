import { Outlet, Navigate } from "react-router-dom";
import {useAuthStore} from "@/stores/useAuthStore.js";

export default function ProtectedRoute({ requiredRole }) {
    const accessToken = useAuthStore((state) => state.accessToken);
    const userRole = useAuthStore((state) => state.user?.role);

    if (requiredRole && userRole !== requiredRole.toLowerCase()) return <Navigate to="/" replace />;


    if (!accessToken) return <Navigate to="/login" replace />;
    if (requiredRole && userRole !== requiredRole) return <Navigate to="/" replace />;

    return <Outlet />;
}

