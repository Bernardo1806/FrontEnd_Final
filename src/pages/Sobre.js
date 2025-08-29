import { Container, Card, Row, Col } from 'react-bootstrap';
import './css/Sobre.css';
import Loading from './Loading';
import { useRef, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import emailjs from "@emailjs/browser";
import { envioEmail, emailSobre } from "../assets/envioEmail";

function Sobre() {
    const [form, setForm] = useState({ nome: "", mensagem: "", email: "", assunto: "" });
    const handleChangeForm = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const integrantes = [
        { nome: "Gabriel Fonseca Quina", ra: "0900057947" },
        { nome: "Bernardo Soares", ra: "0900052953" }
    ];
    const [showLoader, setShowLoader] = useState(true);
    const minLoadingTime = 0;

    const handleFinishLoading = () => {
        setShowLoader(false);
    };
    const hasSentLog = useRef(false);
    useEffect(() => {
        import('./Loading');

        document.title = "Sobre o Projeto";
        if (!hasSentLog.current) {
            envioEmail("Sobre o Projeto");
            hasSentLog.current = true;
        }
    }, []);
    if (showLoader) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />;
    }

    const admin = localStorage.getItem("tipoUsuario") === "Administrador";

    return (
        <Container className="mt-5 mb-5">
            <Card className="p-4 shadow-sm bg-light">
                <h2 className="text-center mb-4">Sobre o Projeto</h2>
                <p>
                    Este projeto foi desenvolvido como parte da disciplina de <strong>Desenvolvimento Web</strong>, com o objetivo de aplicar conceitos de React, consumo de APIs e estilização com Bootstrap.
                </p>
                <p>
                    O sistema é um mini jogo interativo de adivinhação de Pokémons, baseado na <strong>PokeAPI</strong>, e também conta com uma galeria ilustrativa com cores dinâmicas baseadas nos tipos dos Pokémons.
                </p>

                <h4 className="mt-5 mb-3">Tecnologias Utilizadas</h4>
                <ul>
                    <li>React</li>
                    <li>Bootstrap (React-Bootstrap)</li>
                    <li>Axios</li>
                    <li>PokeAPI</li>
                    <li>EmailJS</li>
                    <li>React Router DOM</li>
                    <li>React Icons</li>
                    <li>React Modal</li>
                    <li>React Bootstrap Icons</li>
                    <li>React Spinners</li>

                </ul>

                <h4 className="mt-5 mb-3">Integrantes do Grupo G5</h4>
                <Row>
                    {integrantes.map((pessoa, index) => (
                        <Col key={index} md={4} className="mb-3">
                            <Card className="h-100 p-3 bg-white border-0 shadow">
                                <h5>{pessoa.nome}</h5>
                                <p><strong>Matricula:</strong> {pessoa.ra}</p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
            <Row className="justify-content-center">
                <Col xs={8} md={8} lg={6}>
                    <Card className="p-4 bg-white shadow mt-4">
                        <h4 className="text-center mb-4">Envie uma Mensagem</h4>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                            try {
                                const enviado = emailSobre(form.nome, form.assunto, form.mensagem);
                                if (enviado) {
                                    setForm({ nome: "", mensagem: "", email: "", assunto: "" });
                                } else {
                                    alert("Erro ao enviar mensagem. Tente novamente mais tarde.");
                                }
                            } catch (err) {
                                alert("Erro inesperado ao enviar.");
                            }

                        }}>
                            <Form.Group className="mb-3" controlId="formNome">
                                <Form.Label>Nome</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Seu nome"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChangeForm}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formAssunto">
                                <Form.Label>Assunto</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Assunto da mensagem"
                                    name="assunto"
                                    value={form.assunto}
                                    onChange={handleChangeForm}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formMensagem">
                                <Form.Label>Mensagem</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Sua mensagem"
                                    name="mensagem"
                                    value={form.mensagem}
                                    onChange={handleChangeForm}
                                    required
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Enviar Mensagem
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {admin && (
                <div className="text-center mt-4 bg-light p-3 rounded">
                    <h5>Visualização JSON (Apenas para Administradores)</h5>
                    <pre className="text-start">
                        {JSON.stringify({ integrantes }, null, 2)}
                    </pre>
                </div>
            )}
        </Container>
    );
}

export default Sobre;
