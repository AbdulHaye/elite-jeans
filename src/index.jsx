import React from "react";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ConfirmationDialogProvider from "./Components/dialog/ConfirmationDialogProvider";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfirmationDialogProvider>
        <App />
      </ConfirmationDialogProvider>
    </BrowserRouter>
  </React.StrictMode>
);
