import { Outlet } from "react-router-dom"
import Header from './Header.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        {/* Tất cả các trang của bạn (Home, Tours...) sẽ được render ở đây */}
        <Outlet /> 
      </main>
      <Footer />
    </>
  );
}