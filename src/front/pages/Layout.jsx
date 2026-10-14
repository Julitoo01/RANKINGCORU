import { Outlet } from "react-router-dom";

import { Navbar } from "../components/Navbar.jsx";
import { Footer } from "../components/Footer.jsx";
import { LanguageButton } from "../components/LanguageButton.jsx";

export const Layout = () => {
  return (
    <>
      <LanguageButton />

      <Navbar />

      <main className="main-container">
        <Outlet />
      </main>

      <Footer />
    </>
  );
};