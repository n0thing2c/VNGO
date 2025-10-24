import { BrowserRouter, Route, Routes } from "react-router";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "sonner";
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes*/}

          <Route path="/signup" element={<SignUpPage />} />

          {/* protected routes*/}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
