import {BrowserRouter, Route, Routes} from "react-router-dom";
import TourCreate from "@/pages/TourCreate.jsx";
import TourPost from "@/pages/TourPost.jsx";
import {Toaster} from "sonner";
import TourEdit from "@/pages/TourEdit.jsx";
import Layout from "@/components/layout/Layout.jsx";
import HomePage from "@/pages/HomePage.jsx";
import ToursShowPage from "@/pages/ToursShowPage.jsx";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import InfoPage from "./pages/PersonalInfoPage";
import GuidePublicProfilePage from "@/pages/GuidePublicProfilePage.jsx";
import GuideProfilePage from "@/pages/GuideProfilePage.jsx";
import ScrollToTop from "./components/ScrollToTop";
function App() {
    return (
        <>
            <Toaster position="top-center" richColors/>
            <BrowserRouter>
                <ScrollToTop />
                <Routes>
                    {/* public routes*/}
                    {/* protected routes*/}
                    <Route path="/" element={<Layout/>}>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/tours" element={<ToursShowPage/>}/>
                        <Route path="/profile" element={<GuideProfilePage />} />
                        <Route path="/public-profile" element={<GuidePublicProfilePage />} />

                        <Route path="/tour/create" element={<TourCreate/>}/>
                        <Route path="/tour/post/:tour_id" element={<TourPost/>}/>
                        <Route path="/tour/edit/:tour_id" element={<TourEdit/>}/>

                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/login" element={<LogInPage />} />
                        <Route path="/personal-info" element={<InfoPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;