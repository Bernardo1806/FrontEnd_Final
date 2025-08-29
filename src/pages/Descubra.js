import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, ListGroup, Modal } from 'react-bootstrap';
import { FiRefreshCw } from "react-icons/fi";
import { BsGlobeCentralSouthAsia } from "react-icons/bs";
import { FaPhabricator } from "react-icons/fa6";
import { MdCatchingPokemon } from "react-icons/md";
import "./css/Descubra.css";
import emailjs from "@emailjs/browser";
import Loading from './Loading'
import { envioEmail } from "../assets/envioEmail";

function Descubra() {
    const [pokemon, setPokemon] = useState(null);
    const [guess, setGuess] = useState('');
    const [attempts, setAttempts] = useState([]);
    const [correct, setCorrect] = useState(false);
    const [allNames, setAllNames] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');

    const [showGenHint, setShowGenHint] = useState(false);
    const [generationHint, setGenerationHint] = useState('');
    const [showAbilityHint, setShowAbilityHint] = useState(false);
    const [abilityHint, setAbilityHint] = useState('');
    const [showImageCenterHint, setShowImageCenterHint] = useState(false);

    const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

    const [showModal, setShowModal] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const [showLoader, setShowLoader] = useState(true);
    const minLoadingTime = 0;

    const admin = localStorage.getItem('tipoUsuario') === 'Administrador' ? true : false;
    // console.log("Tipo de admin:", admin);

    const handleFinishLoading = () => {
        setShowLoader(false)
    }

    const generateRandomOffset = () => {
        const rand = () => (Math.random() * 60) - 30;
        return { x: rand(), y: rand() };
    };

    const getImageStyle = () => {
        const tries = attempts.length;

        if (correct || showImageCenterHint) {
            return {
                transform: `translate(-50%, -50%) scale(1)`,
                top: '50%',
                left: '50%',
                transformOrigin: 'center center',
                position: 'absolute',
            };
        }

        const zoomMap = [2.2, 2.0, 1.8, 1.6, 1.4, 1.2, 1.1, 1.05, 1.02, 1.0];
        const zoom = zoomMap[Math.min(tries, zoomMap.length - 1)];

        return {
            transform: `translate(${initialOffset.x}%, ${initialOffset.y}%) scale(${zoom})`,
            position: 'absolute',
        };
    };

    useEffect(() => {
        const fetchPokemon = async () => {
            const maxId = 1025;
            let validPokemon = null;

            while (!validPokemon) {
                const id = Math.floor(Math.random() * maxId) + 1;
                try {
                    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
                    const image = response.data.sprites.other['official-artwork'].front_default;

                    if (image) {
                        const ability = response.data.abilities?.[0]?.ability?.name || '';
                        validPokemon = {
                            name: response.data.name,
                            image: image,
                            id: response.data.id,
                        };
                        setAbilityHint(`Habilidade: ${ability.charAt(0).toUpperCase() + ability.slice(1)}`);
                    }
                } catch (error) {
                    continue;
                }
            }

            document.title = "Adivinhação de Pokémons"
            envioEmail("Mini game - Adivinhação de Pokémons")

            setInitialOffset(generateRandomOffset());
            setPokemon(validPokemon);
        };

        const fetchNames = async () => {
            const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=2000');
            setAllNames(
                response.data.results.map(p => {
                    const id = p.url.split('/').filter(Boolean).pop();
                    return { name: p.name, id };
                })
            );

        };

        fetchPokemon();
        fetchNames();
        if (!showLoader) {
            window.scrollTo(0, 0);
        }
    }, [showLoader]);

    if (showLoader) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />
    }

    const getGeneration = (id) => {
        if (id <= 151) return 'I';
        if (id <= 251) return 'II';
        if (id <= 386) return 'III';
        if (id <= 493) return 'IV';
        if (id <= 649) return 'V';
        if (id <= 721) return 'VI';
        if (id <= 809) return 'VII';
        if (id <= 905) return 'VIII';
        return 'IX';
    };

    const revealGenerationHint = () => {
        const gen = getGeneration(pokemon.id);
        setGenerationHint(`Dica: Esse Pokémon é da geração ${gen}`);
        setShowGenHint(true);
    };

    const handleGuess = async (e) => {
        e.preventDefault();
        const normalized = guess.trim().toLowerCase();
        if (!normalized) return;

        const nameIsValid = allNames.some(p => p.name.toLowerCase() === normalized);
        if (!nameIsValid) {
            setAlertMessage('Digite um nome de Pokémon válido!');
            setGuess('');
            setSuggestions([]);
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        if (attempts.some(attempt => attempt.name === normalized)) {
            setAlertMessage('Você já tentou esse Pokémon!');
            setGuess('');
            setSuggestions([]);
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        if (normalized === pokemon.name.toLowerCase()) {
            setCorrect(true);
            setAttempts(prev => [...prev, { name: normalized, image: pokemon.image }]);
            setShowModal(true);
        } else {
            try {
                const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${normalized}`);
                const imageUrl = response.data.sprites.other['official-artwork'].front_default;
                setAttempts(prev => [...prev, { name: normalized, image: imageUrl }]);
            } catch (error) {
                setAttempts(prev => [...prev, { name: normalized, image: null }]);
            }
        }

        setGuess('');
        setSuggestions([]);
    };

    const sendEmail = (e) => {
        e.preventDefault();

        const templateParams = {
            to_email: userEmail,
            pokemon_name: pokemon.name,
            total_attempts: attempts.length,
        };

        emailjs.send('service_vqi7mlk', 'template_1i4c3iy', templateParams, 'VxnhsgVhBwkWbVxha')
            .then((response) => {
                console.log('Email enviado com sucesso!', response.status, response.text);
                setEmailSent(true);
            }, (error) => {
                console.log('Erro ao enviar o email:', error);
            });
    };

    const handleInputChange = (e) => {
        const input = e.target.value;
        setGuess(input);

        if (input.length === 0) {
            setSuggestions([]);
            return;
        }

        const filtered = allNames.filter(p =>
            p.name.toLowerCase().startsWith(input.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 1025));
    };

    const handleSuggestionClick = (name) => {
        setGuess(name);
        setSuggestions([]);
    };

    const restartGame = async () => {
        const maxId = 1025;
        let validPokemon = null;

        while (!validPokemon) {
            const id = Math.floor(Math.random() * maxId) + 1;
            try {
                const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
                const image = response.data.sprites.other['official-artwork'].front_default;

                if (image) {
                    const ability = response.data.abilities?.[0]?.ability?.name || '';
                    validPokemon = {
                        name: response.data.name,
                        image: image,
                        id: response.data.id,
                    };
                    setAbilityHint(`Habilidade: ${ability.charAt(0).toUpperCase() + ability.slice(1)}`);
                }
            } catch (error) {
                continue;
            }
        }

        setInitialOffset(generateRandomOffset());
        setPokemon(validPokemon);
        setAttempts([]);
        setCorrect(false);
        setGuess('');
        setSuggestions([]);
        setShowGenHint(false);
        setGenerationHint('');
        setShowAbilityHint(false);
    };

    return (
        <>
            <Container className="Background mx-auto d-block mt-5 mb-5 p-4">
                <h5 className="mb-4 text-center title">De que Pokémon é esta silhueta?</h5>

                {pokemon && (
                    <div className="d-flex align-items-center justify-content-center mb-4">
                        <div className="pokemon-mask-container">
                            <div className={`pokemon-mask`}>
                                <div className={`pokemon-background-image`}></div>
                                <img
                                    src={pokemon.image}
                                    alt="Pokémon Silhueta"
                                    className={`pokemon-img ${correct ? 'revealed' : 'silhouette'}`}
                                    style={getImageStyle()}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className='text-center my-3'>
                    <button
                        className="refresh-button"
                        onClick={restartGame}
                        title="Recomeçar"
                    >
                        Recomeçar
                        <FiRefreshCw size={24} className='ms-3' />
                    </button>
                </div>

                <div className="hint-section mt-4 border border-dark">
                    <h5 className="mb-3 title">DICAS</h5>

                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <div className={`hint-card ${attempts.length >= 5 ? 'unlocked' : ''}`}>
                            <MdCatchingPokemon className='hint-icon-bg' />
                            <div className="hint-title">Geração</div>
                            <div className="hint-subtext">Dica disponível após 5 tentativas</div>
                            {attempts.length >= 5 && !showGenHint && (
                                <Button variant="outline-primary" size="sm" onClick={revealGenerationHint}>
                                    Mostrar
                                </Button>
                            )}
                            {showGenHint && <div className="hint-result mt-2">{generationHint}</div>}
                        </div>

                        <div className={`hint-card ${attempts.length >= 7 ? 'unlocked' : ''}`}>
                            <FaPhabricator className='hint-icon-bg' />
                            <div className="hint-title">Habilidade</div>
                            <div className="hint-subtext">Dica disponível após 7 tentativas</div>
                            {attempts.length >= 7 && !showAbilityHint && (
                                <Button variant="outline-primary" size="sm" onClick={() => setShowAbilityHint(true)}>
                                    Mostrar
                                </Button>
                            )}
                            {showAbilityHint && (
                                <div className="hint-result mt-2">{abilityHint}</div>
                            )}
                        </div>
                        <div className={`hint-card ${attempts.length >= 10 ? 'unlocked' : ''}`}>
                            <BsGlobeCentralSouthAsia className='hint-icon-bg' />
                            <div className="hint-title">Imagem Centralizada</div>
                            <div className="hint-subtext">Dica disponível após 10 tentativas</div>

                            {attempts.length >= 10 && !showImageCenterHint && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => setShowImageCenterHint(true)}
                                >
                                    Mostrar
                                </Button>
                            )}

                            {showImageCenterHint && (
                                <div className="hint-result mt-2 text-success">
                                    A imagem foi centralizada!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
            <Container className="Background rounded-3 mx-auto d-block mt-5 mb-5 p-4 text-center">
                {alertMessage && (
                    <div className="alert alert-warning py-2">
                        {alertMessage}
                    </div>
                )}

                {!correct && (
                    <Form onSubmit={handleGuess} autoComplete="off">
                        <Form.Group className="mb-2 position-relative">
                            <Form.Control
                                type="text"
                                placeholder="Digite o nome do Pokémon"
                                value={guess}
                                onChange={handleInputChange}
                                autoFocus
                            />
                            {suggestions.length > 0 && (
                                <ListGroup className="autocomplete-list">
                                    {suggestions.map((p, i) => (
                                        <ListGroup.Item
                                            key={i}
                                            action
                                            onClick={() => handleSuggestionClick(p.name)}
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
                        </Form.Group>
                        <Button type="submit" variant="primary">Enviar</Button>
                    </Form>
                )}
            </Container>

            <Container className="Background rounded-3 mx-auto d-block mt-5 mb-5 p-4 text-center">
                <h5 className="mb-4 title">Tentativas:</h5>
                <ListGroup className="text-start mx-auto" style={{ maxWidth: 400 }}>
                    {attempts.map((attempt, index) => (
                        <ListGroup.Item
                            key={index}
                            variant={attempt.name === pokemon?.name.toLowerCase() ? 'success' : ''}
                            className="d-flex align-items-center gap-2"
                        >
                            {attempt.image && (
                                <img
                                    src={attempt.image}
                                    alt={attempt.name}
                                    style={{ width: 40, height: 40 }}
                                    className="shadow-img"
                                />
                            )}
                            <span>{attempt.name.charAt(0).toUpperCase() + attempt.name.slice(1)}</span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>

            {admin && (
                <div className="mt-4 text-start m-3">
                    <pre className="bg-light p-3 rounded">
                        <h5>Visualização JSON (Apenas para Administradores)</h5>
                        {JSON.stringify(pokemon, null, 2)}
                    </pre>
                </div>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered animation={true}>
                <Modal.Header closeButton>
                    <Modal.Title>🎉 Parabéns!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Você adivinhou o Pokémon: <strong>{pokemon?.name.charAt(0).toUpperCase() + pokemon?.name.slice(1)}</strong>!</p>
                    <p>Total de tentativas: <strong>{attempts.length}</strong></p>

                    {!emailSent ? (
                        <Form onSubmit={sendEmail}>
                            <Form.Group className="mb-3">
                                <Form.Label>Quer receber esse resultado por email?</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Digite seu email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Enviar
                            </Button>
                        </Form>
                    ) : (
                        <div className="text-success">
                            ✅ Email enviado com sucesso!
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Descubra;