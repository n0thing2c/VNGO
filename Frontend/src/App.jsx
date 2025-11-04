import {BrowserRouter, Route, Routes} from "react-router-dom";
import TourCreate from "@/pages/TourCreate.jsx";
import TourPost from "@/pages/TourPost.jsx";
import {Toaster} from "sonner";
import TourEdit from "@/pages/TourEdit.jsx";

function App() {
    return (
        <>
            <Toaster position="top-center" richColors/>
            <BrowserRouter>
                <Routes>
                    {/* public routes*/}

                    <Route path="/tour/create" element={<TourCreate/>}/>
                    <Route path="/tour/post/:tour_id" element={<TourPost/>}/>
                    <Route path="/tour/edit/:tour_id" element={<TourEdit/>}/>
                    {/* protected routes*/}
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;