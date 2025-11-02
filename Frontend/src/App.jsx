import { useState } from "react";
//import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ToursShowPage from "./pages/ToursShowPage";
import Layout from './components/layout/Layout'
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
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
