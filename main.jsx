import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import WarRoom from "./WarRoom.jsx";

function Root() {
  const [view, setView] = useState(() => localStorage.getItem("bm_view") || "warroom");
  const toggle = () => {
    const next = view === "app" ? "warroom" : "app";
    localStorage.setItem("bm_view", next);
    setView(next);
  };
  return (
    <>
      <button
        onClick={toggle}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          background: view === "warroom" ? "#1e40af" : "#7c3aed",
          color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 18px", cursor: "pointer", fontSize: 12,
          fontWeight: 700, letterSpacing: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
        }}
      >
        {view === "warroom" ? "← CRM" : "⚡ WAR ROOM"}
      </button>
      {view === "warroom" ? <WarRoom /> : <App />}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
