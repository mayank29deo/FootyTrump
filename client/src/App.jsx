import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SoloSetup from './pages/SoloSetup.jsx'
import SoloGame from './pages/SoloGame.jsx'
import Results from './pages/Results.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solo/setup" element={<SoloSetup />} />
      <Route path="/solo" element={<SoloGame />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}
