import './App.css'
import { lazy, Suspense, useState, useEffect } from 'react'
import Loading from './pages/Loading'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { envioEmail } from "./assets/envioEmail";

const Menu = lazy(() => import('./pages/Menu'))
const Login = lazy(() => import('./pages/Login'))
const Descubra = lazy(() => import('./pages/Descubra'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Galeria = lazy(() => import('./pages/Galeria'))
const Sobre = lazy(() => import('./pages/Sobre'))
const Busca = lazy(() => import('./pages/Busca'))
const Time = lazy(() => import('./pages/Time'))

function App() {
  const [showLoader, setShowLoader] = useState(true)
  const minLoadingTime = 2500

  const handleFinishLoading = () => {
    setShowLoader(false)
  }

  useEffect(() => {
    import('./pages/Login')
    import('./pages/Menu')
    import('./pages/Descubra')
    import('./pages/NotFound')
    import('./pages/Galeria')
    import('./pages/Sobre')
    import('./pages/Busca')
    import('./pages/Time')

    const Caminho = window.location.href.split('/')[3]

    if (Caminho === "descubra" || Caminho === "Descubra") {
      document.title = "Adivinhação de Pokémons"
      document.querySelector("meta[name='description']").setAttribute("content", "Página de Adivinhação de Pokémons")
      envioEmail("Mini game - Adivinhação de Pokémons")
    }
    else if (Caminho === "sobre" || Caminho === "Sobre") {
      document.title = "Sobre o  Projeto"
      document.querySelector("meta[name='description']").setAttribute("content", "Página sobre o projeto")
      envioEmail("Sobre  o Projeto")
    }
    else if (Caminho === "galeria" || Caminho === "Galeria") {
      document.title = "Pokédex - Geração 1"
      document.querySelector("meta[name='description']").setAttribute("content", "Pokédex")
      envioEmail("Pokédex")
    }
    else if (Caminho === "busca" || Caminho === "Busca") {
      document.title = "Busca"
      document.querySelector("meta[name='description']").setAttribute("content", "Página de busca de Pokémons")
      envioEmail("Busca")
    }
    else if (Caminho === "time" || Caminho === "Time") {
      document.title = "Monte seu Time"
      document.querySelector("meta[name='description']").setAttribute("content", "Monte seu time Pokémon")
      envioEmail("Monte seu time Pokémon")
    }
    else if (Caminho === "") {
      document.title = "Login"
      document.querySelector("meta[name='description']").setAttribute("content", "Página de login")
    } else {
      document.title = "Página não encontrada"
      document.querySelector("meta[name='description']").setAttribute("content", "Página não encontrada")
      envioEmail("Página não encontrada")
    }

  }, [])

  if (showLoader) {
    return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />
  }

  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/descubra" element={<Menu><Descubra /></Menu>} />
          <Route path="/galeria" element={<Menu><Galeria /></Menu>} />
          <Route path="/sobre" element={<Menu><Sobre /></Menu>} />
          <Route path="/busca/:nome" element={<Menu><Busca /></Menu>} />
          <Route path="/time" element={<Menu><Time /></Menu>} />

          <Route path="*" element={<Menu><NotFound>Página não encontrada</NotFound></Menu>} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
