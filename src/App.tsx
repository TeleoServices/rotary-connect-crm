import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">RotaryConnect CRM</h1>
            <p className="text-muted-foreground">Local business outreach platform for Rotary clubs</p>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App
