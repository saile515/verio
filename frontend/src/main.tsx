import "./index.css";

import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import { Home } from "./routes/home";
import { Report } from "./routes/report";
import { StrictMode } from "react";
import { Test } from "./routes/test";
import { createRoot } from "react-dom/client";

function Layout() {
    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-50 font-display">
            <Outlet />
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route Component={Layout}>
                    <Route path="/" Component={Home} />
                    <Route path="/test" Component={Test} />
                    <Route path="/report" Component={Report} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
