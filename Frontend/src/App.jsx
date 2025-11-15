import { BrowserRouter, Route, Routes } from "react-router";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import InfoPage from "./pages/PersonalInfoPage";
import ChatPage from "./pages/ChatPage";
import { Toaster } from "sonner";
function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes*/}

          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LogInPage />} />
          <Route path="/personal-info" element={<InfoPage />} />
          <Route path="/chat" element={<ChatPage />} />

          {/* protected routes*/}
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
