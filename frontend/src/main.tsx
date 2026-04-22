import "./index.css";

import { BrowserRouter, Route, Routes } from "react-router";

import { Report } from "./routes/report";
import { StrictMode } from "react";
import { Test } from "./routes/test";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/test" Component={Test} />
                <Route path="/report" Component={Report} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
