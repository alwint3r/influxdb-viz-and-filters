import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { VisProvider } from "./contexts/vis.context";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VisProvider>
      <App />
    </VisProvider>
  </React.StrictMode>
);
