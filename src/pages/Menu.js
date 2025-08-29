import { Link, useNavigate } from "react-router-dom";
import PrivateRoute from "../PrivateRoute";
import axios from 'axios'
import { Navbar, Container, Nav, Dropdown, Modal, ButtonGroup, Form, FormControl, Button, ListGroup } from "react-bootstrap";
import { useState, useEffect } from "react";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { IoIosSearch } from "react-icons/io";
import { FaArrowUp } from "react-icons/fa";
import "./css/Navbar.css";
import adminAvatar from "../assets/adminAvatar.png"
import userAvatar from "../assets/userAvatar.png"
import logo from "../assets/pokeball.png"

const Menu = ({ children }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [allNames, setAllNames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busca/${searchTerm.trim().toLowerCase()}`);
      setSearchTerm('');
    }
  };

  const tipoUsuario = localStorage.getItem("tipoUsuario") || "Usuário";
  const avatarImg = tipoUsuario === "Administrador" ? adminAvatar : userAvatar

  const [showModal, setShowModal] = useState(false);
  const [readyToLogout, setReadyToLogout] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=2000');
        setAllNames(
          response.data.results.map(p => {
            const id = p.url.split('/').filter(Boolean).pop();
            return { name: p.name, id };
          })
        );
      } catch (error) {
        console.error('Erro ao buscar lista de pokémons:', error);
      }
    };

    fetchNames();
  }, []);

  const handleInputChange = (e) => {
    const input = e.target.value;
    setSearchTerm(input);

    if (input.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = allNames.filter(p =>
      p.name.toLowerCase().startsWith(input.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 1025));
  };

  const handleLogout = () => {
    setShowModal(true);

    setTimeout(() => {
      setReadyToLogout(true);
    }, 2000);
  };

  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll)
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (readyToLogout) {
      localStorage.removeItem("auth");
      localStorage.removeItem("tipoUsuario");
      setShowModal(false);
      navigate("/");
    }
  }, [readyToLogout, navigate]);

  return (
    <PrivateRoute>
      <div className="Menu">
        <Navbar expand="lg" className="Navbar-background px-2">
          <Container fluid className="d-flex justify-content-between align-items-center">
            <Navbar.Brand as={Link} to="/descubra">
              <img className="logo" src={logo} alt="logo" />
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="navbar-nav" />

            <div className="navbar-center mx-auto">
              <Navbar.Collapse id="navbar-nav" className="d-flex justify-content-center">
                <ButtonGroup className="shadow rounded-3 z-2">
                  <Nav.Link as={Link} to="/descubra" className="btn px-4 py-2 custom-navbar">Adivinha</Nav.Link>
                  <Nav.Link as={Link} to="/galeria" className="btn px-4 py-2 custom-navbar">Pokédex</Nav.Link>
                  <Nav.Link as={Link} to="/Time" className="btn px-4 py-2 custom-navbar">Time</Nav.Link>
                  <Nav.Link as={Link} to="/sobre" className="btn px-4 py-2 custom-navbar">Sobre</Nav.Link>
                </ButtonGroup>
              </Navbar.Collapse>
            </div>

            <div className="d-flex align-items-center">
              <Form className="pokemon-search-wrapper me-4 position-relative" onSubmit={handleSubmit}>
                <FormControl
                  type="search"
                  placeholder="Buscar Pokémon"
                  className="form-control-custom"
                  style={{ backgroundColor: '#737373', borderColor: '#737373', color: '#c2c4c7', paddingRight: '40px' }}
                  value={searchTerm}
                  onChange={handleInputChange}
                />

                <Button type="submit" className="search-icon-button" variant="secondary">
                  <IoIosSearch size={24} />
                </Button>

                {suggestions.length > 0 && (
                  <ListGroup
                    className="autocomplete-list-nav position-absolute shadow"
                    style={{
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '80vh',
                      overflowY: 'auto',
                    }}
                  >
                    {suggestions.map((p, i) => (
                      <ListGroup.Item
                        key={i}
                        action
                        onClick={() => {
                          navigate(`/busca/${p.name.toLowerCase()}`);
                          setSearchTerm('');
                          setSuggestions([]);
                        }}
                        className="d-flex align-items-center gap-2"
                      >
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          alt={p.name}
                          style={{ width: 32, height: 32 }}
                        />
                        <span>{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Form>

              <Dropdown className="navbar-avatar-dropdown">
                <Dropdown.Toggle
                  as="img"
                  src={avatarImg}
                  alt="Avatar"
                  className="avatar-img"
                />
                <Dropdown.Menu className="custom-dropdown-menu">
                  <Dropdown.Header style={{ color: '#fff' }}>{tipoUsuario}</Dropdown.Header>
                  <Dropdown.Item onClick={handleLogout}>
                    <RiLogoutCircleRLine style={{ marginRight: 6 }} />
                    Sair
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

          </Container>
        </Navbar>

        <div style={{ flex: 1 }}>
          {children}
        </div>

        {showButton && (
          <Button
            onClick={scrollToTop}
            className="scroll-to-top"
            variant="primary"
            title="Voltar ao Topo"
          >
            <FaArrowUp />
          </Button>
        )}

        <footer className="footer">
          <span>&copy; {new Date().getFullYear()} Pokemail. Todos os direitos reservados.</span>
          <span>Desenvolvido por Bernarndo Soares e Gabriel Quina</span>
        </footer>

        <Modal show={showModal} backdrop="static" keyboard={false} centered>
          <Modal.Header><Modal.Title>Logout</Modal.Title></Modal.Header>
          <Modal.Body>Logout realizado com sucesso! Redirecionando...</Modal.Body>
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Menu;
