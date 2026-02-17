import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginPage from './pages/login'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <LoginPage></LoginPage>
    </>
  )
}

export default App
