import { useParams, Link } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ProgressBar, Container } from 'react-bootstrap';
import { envioEmail } from "../assets/envioEmail";
import Loading from './Loading';
import "./css/Buscar.css"
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

function Busca() {
    const { nome } = useParams();
    //const [searchParams] = useSearchParams();
    //const nome = searchParams.get('nome');
    const [pokemon, setPokemon] = useState(null);
    const [erro, setErro] = useState('');

    const [showLoader, setShowLoader] = useState(true);
    const minLoadingTime = 0;

    const handleFinishLoading = () => {
        setShowLoader(false);
    };
    const hasSentLog = useRef(false);

    const typeColors = {
        normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
        grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
        ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
        rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
        steel: '#B7B7CE', fairy: '#D685AD',
    };

    const allTypes = Object.keys(typeColors);
    const firstRowTypes = allTypes.slice(0, 9);
    const secondRowTypes = allTypes.slice(9, 18);

    const [evolutionData, setEvolutionData] = useState([]);

    const maxId = 1025;
    const [prevPokemon, setPrevPokemon] = useState(null);
    const [nextPokemon, setNextPokemon] = useState(null);
    const [damageMultipliers, setDamageMultipliers] = useState({});

    const getPreviousPokemonId = (currentId) => {
        return currentId === 1 ? maxId : currentId - 1;
    };

    const getNextPokemonId = (currentId) => {
        return currentId === maxId ? 1 : currentId + 1;
    };

    const fetchPokemonNameById = async (id) => {
        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
            return { id: res.data.id, name: res.data.name };
        } catch {
            return null;
        }
    };

    const parseEvolutionChain = (chain) => {
        const evolutions = [];
        let currentStage = chain;

        do {
            evolutions.push({
                name: currentStage.species.name,
            });
            currentStage = currentStage.evolves_to[0];
        } while (!!currentStage && currentStage.hasOwnProperty('evolves_to'));

        return evolutions;
    };

    function formatAbilityName(name) {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    const fetchTypeDamageRelations = async (type) => {
        try {
            const res = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
            return res.data.damage_relations;
        } catch (error) {
            console.error('Erro ao buscar damage_relations:', error);
            return null;
        }
    };

    const calculateDamageMultipliers = async (types) => {
        const typeList = Object.keys(typeColors);
        const multipliers = {};

        typeList.forEach(t => multipliers[t] = 1);

        for (const type of types) {
            const damageRelations = await fetchTypeDamageRelations(type);
            if (!damageRelations) continue;

            damageRelations.double_damage_from.forEach(({ name }) => multipliers[name] *= 2);
            damageRelations.half_damage_from.forEach(({ name }) => multipliers[name] *= 0.5);
            damageRelations.no_damage_from.forEach(({ name }) => multipliers[name] *= 0);
        }

        return multipliers;
    };

    function getStatColor(value) {
        if (value < 60) return 'danger';
        if (value < 80) return 'warning';
        if (value < 100) return 'yellow';
        if (value < 150) return 'success';
        return 'info';
    }

    useEffect(() => {
        const fetchPokemonData = async () => {
            try {
                setPokemon(null);
                setDamageMultipliers({});
                setEvolutionData([]);
                setErro('');

                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${nome}`);
                const currentPokemon = res.data;
                setPokemon({
                    id: currentPokemon.id,
                    name: currentPokemon.name,
                    image: currentPokemon.sprites.other['official-artwork'].front_default,
                    types: currentPokemon.types.map(t => t.type.name),
                    height: currentPokemon.height,
                    weight: currentPokemon.weight,
                    abilities: currentPokemon.abilities.map(a => a.ability.name),
                    stats: currentPokemon.stats.map(s => ({
                        name: s.stat.name,
                        value: s.base_stat
                    }))
                });

                const prevId = getPreviousPokemonId(currentPokemon.id);
                const nextId = getNextPokemonId(currentPokemon.id);
                const [prevData, nextData] = await Promise.all([
                    fetchPokemonNameById(prevId),
                    fetchPokemonNameById(nextId)
                ]);
                setPrevPokemon(prevData);
                setNextPokemon(nextData);

                const multipliers = await calculateDamageMultipliers(currentPokemon.types.map(t => t.type.name));
                setDamageMultipliers(multipliers);

                const speciesRes = await axios.get(currentPokemon.species.url);
                const evolutionChainUrl = speciesRes.data.evolution_chain.url;

                const evolutionRes = await axios.get(evolutionChainUrl);
                const chain = evolutionRes.data.chain;
                const parsedEvolutions = parseEvolutionChain(chain);

                const evolutionDetails = await Promise.all(
                    parsedEvolutions.map(async (evo) => {
                        const evoRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${evo.name}`);
                        return {
                            id: evoRes.data.id,
                            name: evoRes.data.name,
                            image: evoRes.data.sprites.other['official-artwork'].front_default,
                        };
                    })
                );
                setEvolutionData(evolutionDetails);

            } catch (error) {
                console.error("Error fetching Pokémon data:", error);
                setPokemon(null);
                setErro('Pokémon não encontrado!');
            }
        };

        fetchPokemonData();

        if (!hasSentLog.current) {
            envioEmail("Busca por: " + nome);
            hasSentLog.current = true;
        }
        document.title = `Busca - ${nome}`;
    }, [nome]);

    if (showLoader) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />;
    }

    if (!pokemon || !prevPokemon || !nextPokemon || Object.keys(damageMultipliers).length === 0) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />;
    }

    const admin = localStorage.getItem("tipoUsuario") === "Administrador";

    const renderDamageTable = (typesToRender) => (
        <table className="damage-table">
            <thead>
                <tr>
                    {typesToRender.map(type => (
                        <th key={type} style={{ backgroundColor: typeColors[type] }}>
                            <span className="type-res">{type.slice(0, 3).toUpperCase()}</span>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {typesToRender.map(type => {
                        const multiplier = damageMultipliers[type];
                        let multiplierClass = '';

                        if (multiplier === 0) multiplierClass = 'multiplier-0';
                        else if (multiplier === 0.25) multiplierClass = 'multiplier-0-25';
                        else if (multiplier === 0.5) multiplierClass = 'multiplier-0-5';
                        else if (multiplier === 1) multiplierClass = 'multiplier-1';
                        else if (multiplier === 2) multiplierClass = 'multiplier-2';
                        else if (multiplier === 4) multiplierClass = 'multiplier-4';

                        return (
                            <td key={type} className={multiplierClass}>
                                {multiplier}x
                            </td>
                        );
                    })}
                </tr>
            </tbody>
        </table>
    );

    return (
        <>
            <Container className="mx-auto d-block">
                {erro && <p className="text-danger mt-3">{erro}</p>}
                {pokemon && (
                    <div className="pokemon-page-container mx-auto my-5">

                        <div className="pokemon-navigation-bar d-flex justify-content-between align-items-center mb-4">
                            <Link to={`/busca?nome=${prevPokemon.name.toLowerCase()}`} className="nav-button l-detail d-flex align-items-center gap-2">
                                <FaArrowLeft />
                                <span>#{String(prevPokemon.id).padStart(3, '0')} - {prevPokemon.name.toUpperCase()}</span>
                            </Link>

                            <h2 className="pokemon-header-title mb-0">
                                #{String(pokemon.id).padStart(3, '0')} - {pokemon.name.toUpperCase()}
                            </h2>

                            <Link to={`/busca?nome=${nextPokemon.name.toLowerCase()}`} className="nav-button r-detail d-flex align-items-center gap-2">
                                <span>#{String(nextPokemon.id).padStart(3, '0')} - {nextPokemon.name.toUpperCase()}</span>
                                <FaArrowRight />
                            </Link>
                        </div>

                        <div className="pokemon-top-section mt-5">
                            <div className="pokemon-left">
                                <img src={pokemon.image} alt={pokemon.name} className="pokemon-image" />
                            </div>
                            <div className="pokemon-right">
                                <h2 className="pokedex-data-title">Pokédex Data</h2>
                                <p><strong>N° Pokédex:</strong> {pokemon.id}</p>
                                <div className="pokemon-types d-flex align-items-center">
                                    <strong className="me-2">Tipo(s):</strong>
                                    <div className="types-container d-flex">
                                        {pokemon.types.map(type => (
                                            <div
                                                key={type}
                                                className="type-badge"
                                                style={{ backgroundColor: typeColors[type] || '#777' }}
                                            >
                                                {type.toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p><strong>Altura:</strong> {pokemon.height / 10} m</p>
                                <p><strong>Peso:</strong> {pokemon.weight / 10} kg</p>
                                <div className="pokemon-abilities d-flex">
                                    <strong className="me-2">Habilidades:</strong>
                                    <ol className="mb-0">
                                        {pokemon.abilities.map((ability, index) => (
                                            <li key={index}>{formatAbilityName(ability)}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div className="pokemon-bottom-section d-flex">
                            <div className="pokemon-stats-bottom me-4">
                                <h4 className="pokedex-data-title">Base Stats</h4>
                                {pokemon.stats.map(stat => (
                                    <div key={stat.name} className="stat-line p-1">
                                        <span className="stat-name">{stat.name.toUpperCase()}</span>
                                        <span className="stat-value">{stat.value}</span>
                                        <div className="stat-progress">
                                            <ProgressBar
                                                striped
                                                now={stat.value}
                                                max={200}
                                                variant={getStatColor(stat.value)}
                                                className={getStatColor(stat.value) === 'yellow' ? 'progress-yellow' : ''}
                                                style={{ border: '1px solid rgba(0,0,0,.3)' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pokemon-damage-relations">
                                <h4 className="pokedex-data-title">Fraquezas / Resistências</h4>
                                {renderDamageTable(firstRowTypes)}
                                {renderDamageTable(secondRowTypes)}
                            </div>
                        </div>
                        {evolutionData && evolutionData.length > 1 && (
                            <div className="pokemon-evolution-section">
                                <h4 className="pokedex-data-title">Evolutions</h4>
                                <div className="evolutions-container">
                                    {evolutionData.map((evo, index) => (
                                        <React.Fragment key={evo.id}>
                                            <Link to={`/busca/${evo.name.toLowerCase()}`} className="evolution-card">
                                                <img src={evo.image} alt={evo.name} />
                                                <p>#{String(evo.id).padStart(3, '0')} - {evo.name.toUpperCase()}</p>
                                            </Link>
                                            {index < evolutionData.length - 1 && (
                                                <div className="evolution-arrow">
                                                    <FaArrowRight size="2rem" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {admin && (
                    <div className="mt-4 text-start m-3">
                        <pre className="bg-light p-3 rounded">
                            <h5>Visualização JSON (Apenas para Administradores)</h5>
                            {JSON.stringify({ nome, pokemon }, null, 2)}
                        </pre>
                    </div>
                )}
            </Container>
        </>
    );
}

export default Busca;