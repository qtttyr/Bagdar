import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import GeneratePage from "./pages/GeneratePage";
import MapPage from "./pages/MapPage";
import NomadMode from "./pages/NomadMode";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/nomad" element={<NomadMode />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;