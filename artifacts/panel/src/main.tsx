import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  window.addEventListener("unhandledrejection", (e) => {
    const msg: string = e.reason?.message ?? "";
    if (msg.includes("ClerkJS:") || msg.includes("Clerk:")) {
      e.preventDefault();
    }
  });
  window.addEventListener("error", (e) => {
    const msg: string = e.message ?? "";
    if (msg.includes("ClerkJS:") || msg.includes("Clerk:")) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
