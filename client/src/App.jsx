import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SoloSetup from './pages/SoloSetup.jsx'
import SoloGame from './pages/SoloGame.jsx'
import Lobby from './pages/Lobby.jsx'
import OnlineGame from './pages/OnlineGame.jsx'
import Results from './pages/Results.jsx'
import QuizHome from './pages/QuizHome.jsx'
import GuessFootballer from './pages/GuessFootballer.jsx'
import QuizMcq from './pages/QuizMcq.jsx'
import QuizResults from './pages/QuizResults.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solo/setup" element={<SoloSetup />} />
      <Route path="/solo" element={<SoloGame />} />
      <Route path="/online" element={<Lobby />} />
      <Route path="/online/game" element={<OnlineGame />} />
      <Route path="/quiz" element={<QuizHome />} />
      <Route path="/quiz/guess" element={<GuessFootballer />} />
      <Route path="/quiz/mcq" element={<QuizMcq />} />
      <Route path="/quiz/results" element={<QuizResults />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}
