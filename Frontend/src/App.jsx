import {BrowserRouter, Route, Routes} from "react-router-dom";
import TourCreate from "@/pages/TourCreate.jsx";
import TourPost from "@/pages/TourPost.jsx";
import {Toaster} from "sonner";

function App() {
    return (
        <>
            <Toaster position="top-center" richColors/>
            <BrowserRouter>
                <Routes>
                    {/* public routes*/}

                    <Route path="/tour_create" element={<TourCreate/>}/>
                    <Route path="/tourpost/:id" element={<TourPost/>}/>
                    {/* protected routes*/}
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;