import { BrowserRouter, Route, Routes } from "react-router-dom";
import TourCreate from "@/pages/TourCreate.jsx";
import TourPost from "@/pages/TourPost.jsx";
import { Toaster } from "sonner";
import TourEdit from "@/pages/TourEdit.jsx";
import Layout from "@/components/layout/Layout.jsx";
import HomePage from "@/pages/HomePage.jsx";
import ToursShowPage from "@/pages/ToursShowPage.jsx";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChatPage from "./pages/ChatPage";
import GuidePublicProfilePage from "@/pages/GuidePublicProfilePage.jsx";
import TouristPublicProfilePage from "@/pages/TouristPublicProfilePage.jsx";
import GuideProfilePage from "@/pages/GuideProfilePage.jsx";
import TouristProfilePage from "./pages/TouristProfilePage";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/Auth/ProtectedRoute.jsx";
import ManagementTours from "./pages/ManagementTours";
import { CallProvider } from "@/components/call/CallProvider";
import NotFoundPage from "./pages/NotFoundPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import GuidePolicyPage from "./pages/GuidePolicyPage";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <CallProvider>
        <ScrollToTop />
        <Routes>
          {/*public routes*/}
          {/* <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LogInPage />} /> */}

          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/login" element={<LogInPage />} />
            <Route path="/forget-password" element={<ForgetPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/guide-policy" element={<GuidePolicyPage />} />
            <Route path="/tour/post/:tour_id" element={<TourPost />} />
            <Route path="/tour/:tour_id" element={<TourPost />} />
            <Route index element={<HomePage />} />
            <Route path="/tours" element={<ToursShowPage />} />
            <Route
              path="/public-profile/:guideId"
              element={<GuidePublicProfilePage />}
            />
            <Route
              path="/tourist-public-profile/:touristId"
              element={<TouristPublicProfilePage />}
            />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/management" element={<ManagementTours />} />
            </Route>

            {/* Tourist only routes */}
            <Route element={<ProtectedRoute requiredRole="tourist" />}>
              <Route path="/tourist-profile" element={<TouristProfilePage />} />
            </Route>

            {/* Guide only routes */}
            <Route element={<ProtectedRoute requiredRole="guide" />}>
              <Route path="/guide-profile" element={<GuideProfilePage />} />
              <Route path="/tour/create" element={<TourCreate />} />
              <Route path="/tour/edit/:tour_id" element={<TourEdit />} />
            </Route>

            {/* 404 - Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </CallProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
