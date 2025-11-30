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
import ChatPage from "./pages/ChatPage";
import GuidePublicProfilePage from "@/pages/GuidePublicProfilePage.jsx";
import TouristPublicProfilePage from "@/pages/TouristPublicProfilePage.jsx";
import GuideProfilePage from "@/pages/GuideProfilePage.jsx";
import TouristProfilePage from "./pages/TouristProfilePage";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/Auth/ProtectedRoute.jsx";
import ManagementTours from "./pages/ManagementTours";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
