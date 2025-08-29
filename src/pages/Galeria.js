import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Form } from 'react-bootstrap';
import './css/Galeria.css';
import Loading from "./Loading";
import { envioEmail } from '../assets/envioEmail';

const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD',
};

const geracoes = [
    { id: 1, nome: 'Geração 1 - Kanto' },
    { id: 2, nome: 'Geração 2 - Johto' },
    { id: 3, nome: 'Geração 3 - Hoenn' },
    { id: 4, nome: 'Geração 4 - Sinnoh' },
    { id: 5, nome: 'Geração 5 - Unova' },
    { id: 6, nome: 'Geração 6 - Kalos' },
    { id: 7, nome: 'Geração 7 - Alola' },
    { id: 8, nome: 'Geração 8 - Galar' },
    { id: 9, nome: 'Geração 9 - Paldea' },
];

function Galeria() {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geracaoSelecionada, setGeracaoSelecionada] = useState(1);

    const [showLoader, setShowLoader] = useState(true);
    const minLoadingTime = 0;

    const handleFinishLoading = () => {
        setShowLoader(false);
    }

    const hasSentLog = useRef(false);

    const fetchPorGeracao = async (idGeracao) => {
        setLoading(true);
        setPokemons([]);
        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/generation/${idGeracao}`);
            const species = res.data.pokemon_species;
            const ordenadas = species.sort((a, b) => a.name.localeCompare(b.name));

            const detalhes = await Promise.all(ordenadas.map(async (s) => {
                try {
                    const resDetalhe = await axios.get(`https://pokeapi.co/api/v2/pokemon/${s.name}`);
                    return {
                        id: resDetalhe.data.id,
                        name: resDetalhe.data.name,
                        image: resDetalhe.data.sprites.other['official-artwork'].front_default,
                        types: resDetalhe.data.types.map(t => t.type.name),
                    };
                } catch {
                    return null;
                }
            }));
            const ordenadosPorId = detalhes
                .filter(p => p !== null)
                .sort((a, b) => a.id - b.id);

            setPokemons(ordenadosPorId.filter(p => p && p.image));
        } catch (error) {
            console.error('Erro ao buscar geração', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPorGeracao(geracaoSelecionada);

        document.title = `Pokédex - Geração ${geracaoSelecionada}`;
        import('./Loading')

        if (!hasSentLog.current) {
            envioEmail("Pokédex");
            hasSentLog.current = true;
        }

    }, [geracaoSelecionada]);

    if (showLoader) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />
    }

    const admin = localStorage.getItem('tipoUsuario') === 'Administrador' ? true : false;

    return (
        <>
            <Container className="Background-pokedex mx-auto d-block m-5 px-5 py-4">
                <h2 className="text-center mb-4 title-pokedex">Pokédex</h2>

                <Form.Group className="mb-4 w-100 text-center">
                    <Form.Select
                        className='geracao-select'
                        style={{ maxWidth: '300px', margin: '0 auto' }}
                        value={geracaoSelecionada}
                        onChange={(e) => setGeracaoSelecionada(Number(e.target.value))}
                    >
                        {geracoes.map(g => (
                            <option key={g.id} value={g.id}>{g.nome}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                {loading ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" variant="primary" />
                        <p>Carregando Pokémons...</p>
                    </div>
                ) : (
                    <Row>
                        {pokemons.map((pokemon, idx) => {
                            const mainType = pokemon.types[0];
                            const bgColor = typeColors[mainType] || '#ccc';

                            return (
                                <Col key={idx} md={4} lg={3} className="mb-4">
                                    <Card style={{ backgroundColor: bgColor, zIndex: '2' }} className="text-white shadow pokedex border border-dark" onClick={() => window.location.href = `/busca/${pokemon.name}`}>
                                        <Card.Img
                                            variant="top"
                                            src={pokemon.image}
                                            style={{ backgroundColor: '#fff', padding: '1rem' }}
                                        />
                                        <Card.Body>
                                            <Card.Title>
                                                #{String(pokemon.id).padStart(3, '0')} - {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                                            </Card.Title>
                                            <Card.Text>
                                                {pokemon.types.map(type => (
                                                    <span key={type} className="badge bg-dark me-1">
                                                        {type.toUpperCase()}
                                                    </span>
                                                ))}
                                            </Card.Text>
                                            <Card.Text className="text-center">
                                                <small>Clique para ver detalhes</small>
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
                <div className='pokedex-detail' />
            </Container>
            {admin && (
                <div className="text-center m-4 bg-light p-3 rounded">
                    <h5>Visualização JSON (Apenas para Administradores)</h5>
                    <pre className="text-start">
                        {JSON.stringify({ pokemons, typeColors, geracoes }, null, 2)}
                    </pre>
                </div>

            )}
        </>
    );
}

export default Galeria;
