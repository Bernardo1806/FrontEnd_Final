import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, Modal, Container, Row, Col, Card } from "react-bootstrap";
import { FaSignInAlt } from "react-icons/fa";
import "./css/Login.css";
import usuariosPermitidos from '../data/usuarios.json'; // Importando o JSON com os usuários permitidos

function Login(props) {
    const [form, setForm] = useState({ login: "", senha: "", email : ""});
    const [pokemonUrl, setPokemonUrl] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [alertText, setAlertText] = useState("");
    const navigate = useNavigate();
    
    const fetchPokemon = async () => {
        try {
            const id = Math.floor(Math.random() * 151) + 1;
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const sprite = res.data.sprites.versions["generation-v"]["black-white"].animated.front_default
                || res.data.sprites.front_default;
            setPokemonUrl(sprite);
            setAnimationKey(k => k + 1);
        } catch (e) {
            console.error("Erro ao buscar Pokémon", e);
        }
    };

    useEffect(() => {
        fetchPokemon();
        return () => { };
    }, []);


    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        if (!form.login || !form.senha) {
            setAlertText("Por favor, preencha todos os campos");
            setShowAlert(true);
            return;
        }      

        const user = usuariosPermitidos.find(
            u => u.login === form.login && u.senha === form.senha
        );
        if (user) {
            setAlertText(`Bem-vindo! ${user.tipo}`);
            setShowAlert(true);
            setTimeout(() => {
                localStorage.setItem("auth", "true");
                localStorage.setItem("tipoUsuario", user.tipo);
                localStorage.setItem("email", user.email);
                navigate("/descubra");
            }, 1500);
        } else {
            setAlertText("Usuário ou senha inválidos");
            setShowAlert(true);
        }
    };   

    if (props.menu === "0") return <h1>Sem acesso a essa página...</h1>;


    return (
        <Container fluid className="login-page">
            {pokemonUrl && (
                <img
                    key={animationKey}
                    src={pokemonUrl}
                    alt="Pokémon andando"
                    className="pokemon-walk wiggle"
                    onAnimationEnd={fetchPokemon}
                />
            )}

            <Row className="justify-content-center align-items-center h-100">
                <Col xs={10} md={4}>
                    <div className="login-image-container">
                        <div className="login-title">Login</div>

                        <Form onSubmit={handleSubmit} className="pokedex-form-on-image">
                            <div className="form-top">
                                <Form.Group controlId="formLogin">
                                    <div className="form-login">Insira seu Nome de Usuário</div>
                                    <Form.Control
                                        type="text"
                                        placeholder="Usuário"
                                        name="login"
                                        value={form.login}
                                        onChange={handleChange}
                                        className="pokedex-input-on-image"
                                    />
                                </Form.Group>
                                <Form.Group controlId="formSenha">
                                    <div className="form-login">Insira sua Senha</div>
                                    <Form.Control
                                        type="password"
                                        placeholder="Senha"
                                        name="senha"
                                        value={form.senha}
                                        onChange={handleChange}
                                        className="pokedex-input-on-image"
                                    />
                                </Form.Group>
                            </div>

                            <div className="form-bottom">
                                <div className="button-wrapper">
                                    <Button variant="warning" type="submit" className="login-button-on-image">
                                        <FaSignInAlt size={32} />
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>            

            <Modal show={showAlert} onHide={() => setShowAlert(false)} centered className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Notificação</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{alertText}</p>
                </Modal.Body>
            </Modal>
                        
        </Container>
    );
}

export default Login