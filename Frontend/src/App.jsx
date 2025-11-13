import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import InfoPage from "./pages/PersonalInfoPage";
import TourCreate from "@/pages/TourCreate.jsx";
import TourPost from "@/pages/TourPost.jsx";
import TourEdit from "@/pages/TourEdit.jsx";
import Layout from "@/components/layout/Layout.jsx";
import HomePage from "@/pages/HomePage.jsx";
import ToursShowPage from "@/pages/ToursShowPage.jsx";
function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes*/}
          <Route path="/signup" element={<SignUpPage />} /> <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LogInPage />} />
          <Route path="/personal-info" element={<InfoPage />} />

          <Route path="/tour/create" element={<TourCreate />} />
          <Route path="/tour/post/:tour_id" element={<TourPost />} />
          <Route path="/tour/edit/:tour_id" element={<TourEdit />} />
          {/* protected routes*/}
          <Route path="/" element={<Layout />}>
            {/* public routes*/}
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursShowPage />} />
            {/* <Route path="/signup" element={<SignUpPage />} /> */}

            {/* protected routes*/}
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;