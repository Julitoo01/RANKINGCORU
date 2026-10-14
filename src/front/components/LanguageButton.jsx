import { useEffect, useState } from "react";

export const LanguageButton = () => {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "es"
  );

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguage(localStorage.getItem("language") || "es");
    };

    window.addEventListener("languageChanged", handleLanguageChanged);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChanged);
    };
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === "es" ? "en" : "es";

    localStorage.setItem("language", newLanguage);
    setLanguage(newLanguage);
    window.dispatchEvent(new Event("languageChanged"));
  };

  return (
    <button
      type="button"
      className="global-language-btn"
      onClick={toggleLanguage}
    >
      {language === "es" ? "EN" : "ES"}
    </button>
  );
};