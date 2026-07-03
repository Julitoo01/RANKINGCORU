import ScrollToTop from "../components/ScrollToTop"
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Layout = () => {
  return (
    <div className="app-wrapper">
      <Navbar />

      <main className="main-container">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};