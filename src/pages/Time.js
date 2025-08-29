import { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { MdAdd } from "react-icons/md";
import { IoMdRemoveCircle } from "react-icons/io";
import './css/Time.css';
import Loading from './Loading'
import emailjs from "@emailjs/browser";
import { envioEmail } from '../assets/envioEmail';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';


const MAX_TEAM_SIZE = 6;

function Time() {
  const [team, setTeam] = useState(Array(MAX_TEAM_SIZE).fill(null));
  const [searches, setSearches] = useState(Array(MAX_TEAM_SIZE).fill(''));
  const [loading, setLoading] = useState(Array(MAX_TEAM_SIZE).fill(false));

  const [showLoader, setShowLoader] = useState(true);
  const minLoadingTime = 0;

  const handleFinishLoading = () => {
    setShowLoader(false)
  }

  const [allNames, setAllNames] = useState([]);
  const [suggestions, setSuggestions] = useState(Array(MAX_TEAM_SIZE).fill([]));

  const [teamWeaknesses, setTeamWeaknesses] = useState({});
  const [typesLoaded, setTypesLoaded] = useState(false);

  const typeCache = useRef({});

  const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD',
  };

  const getWeaknessesForType = async (typeName) => {
    if (typeCache.current[typeName]) {
      return typeCache.current[typeName];
    }

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
      const weaknesses = res.data.damage_relations.double_damage_from.map(t => t.name);
      typeCache.current[typeName] = weaknesses;
      return weaknesses;
    } catch (error) {
      console.error(`Erro ao buscar fraquezas para o tipo ${typeName}:`, error);
      return [];
    }
  };

  const getTeamWeaknesses = async (currentTeam) => {
    const weaknesses = {};

    Object.keys(typeColors).forEach(type => {
      weaknesses[type] = [];
    });

    for (const pokemon of currentTeam) {
      if (pokemon) {
        for (const attackType of Object.keys(typeColors)) {
          let multiplier = 1;

          for (const defenseType of pokemon.types) {
            const damageMap = typeCache.current[attackType];
            if (damageMap && damageMap[defenseType] !== undefined) {
              multiplier *= damageMap[defenseType];
            }
          }

          if (multiplier > 1) {
            weaknesses[attackType].push({
              name: pokemon.name,
              multiplier: multiplier
            });
          }
        }
      }
    }
    return weaknesses;
  };


  const getDamageRelationsForType = async (typeName) => {
    if (typeCache.current[typeName]) {
      return typeCache.current[typeName];
    }

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
      const relations = res.data.damage_relations;
      const damageMap = {};

      relations.double_damage_to.forEach(t => damageMap[t.name] = 2);
      relations.half_damage_to.forEach(t => damageMap[t.name] = 0.5);
      relations.no_damage_to.forEach(t => damageMap[t.name] = 0);

      typeCache.current[typeName] = damageMap;
      return damageMap;
    } catch (error) {
      console.error(`Erro ao buscar relations para ${typeName}`, error);
      return {};
    }
  };

  const hasSentLog = useRef(false);

  useEffect(() => {
    const fetchAllNamesAndTypeData = async () => {
      try {
        const res = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=2000');
        setAllNames(
          res.data.results.map(p => {
            const id = p.url.split('/').filter(Boolean).pop();
            return { name: p.name, id };
          })
        );

        const typeNames = Object.keys(typeColors);
        await Promise.all(typeNames.map(type => getDamageRelationsForType(type)));
        setTypesLoaded(true);

      } catch (error) {
        console.error('Erro ao carregar lista de Pokémon ou dados de tipo:', error);
      }
    };

    fetchAllNamesAndTypeData();

    const stored = localStorage.getItem('pokemon_team');
    if (stored) {
      setTeam(JSON.parse(stored));
    }

    if (!hasSentLog.current) {
      envioEmail("Monte seu Time Pokémon");
      hasSentLog.current = true;
    }
    document.title = "Monte seu Time"

  }, []);

  useEffect(() => {
    const loadWeaknesses = async () => {
      if (typesLoaded) {
        const activeTeam = team.filter(p => p !== null);
        if (activeTeam.length > 0) {
          const weaknesses = await getTeamWeaknesses(activeTeam);
          setTeamWeaknesses(weaknesses);
        } else {
          setTeamWeaknesses({});
        }
      }
    };
    loadWeaknesses();
  }, [team, typesLoaded]);


  const handleInputSuggestions = (index, inputValue) => {
    const updatedSearches = [...searches];
    updatedSearches[index] = inputValue;
    setSearches(updatedSearches);

    if (!inputValue.trim()) {
      const clearedSuggestions = [...suggestions];
      clearedSuggestions[index] = [];
      setSuggestions(clearedSuggestions);
      return;
    }

    const filtered = allNames.filter(p =>
      p.name.toLowerCase().startsWith(inputValue.toLowerCase())
    ).slice(0, 1025);

    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index] = filtered;
    setSuggestions(updatedSuggestions);
  };

  const handleSuggestionClick = (index, name) => {
    const updatedSearches = [...searches];
    updatedSearches[index] = name;
    setSearches(updatedSearches);

    const clearedSuggestions = [...suggestions];
    clearedSuggestions[index] = [];
    setSuggestions(clearedSuggestions);
  };

  const handleSearchChange = (index, value) => {
    const updated = [...searches];
    updated[index] = value;
    setSearches(updated);
  };

  const handleSearchSubmit = async (index) => {
    const query = searches[index].toLowerCase().trim();
    if (!query) return;

    const updatedLoading = [...loading];
    updatedLoading[index] = true;
    setLoading(updatedLoading);

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);
      const pokemon = {
        id: res.data.id,
        name: res.data.name,
        image: res.data.sprites.other['official-artwork'].front_default,
        types: res.data.types.map(t => t.type.name),
        abilities: res.data.abilities.map(a => a.ability.name),
        stats: res.data.stats.map(s => ({ name: s.stat.name, value: s.base_stat }))
      };

      const updatedTeam = [...team];
      updatedTeam[index] = pokemon;
      setTeam(updatedTeam);
      localStorage.setItem('pokemon_team', JSON.stringify(updatedTeam));
    } catch (err) {
      alert('Pokémon não encontrado.');
    } finally {
      const updatedLoadingDone = [...loading];
      updatedLoadingDone[index] = false;
      setLoading(updatedLoadingDone);
    }
  };

  const handleRemove = (index) => {
    const updated = [...team];
    updated[index] = null;
    setTeam(updated);
    localStorage.setItem('pokemon_team', JSON.stringify(updated));
  };

  const getAllAbilities = () => {
    const abilityMap = {};
    team.forEach(p => {
      if (p) {
        p.abilities.forEach(ab => {
          if (!abilityMap[ab]) abilityMap[ab] = 0;
          abilityMap[ab]++;
        });
      }
    });
    return Object.entries(abilityMap).sort((a, b) => b[1] - a[1]);
  };

  if (showLoader) {
    return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />
  }

  const admin = localStorage.getItem("tipoUsuario") === "Administrador";

  return (
    <>
      <Container className='time-container mx-auto d-block my-5 p-4'>
        <h2 className='text-center mb-4 title'>Monte seu Time Pokémon</h2>

        <Row className='mb-4'>
          {team.slice(0, 3).map((pokemon, index) => (
            <Col key={index} xs={12} sm={6} md={4}>
              <Card className='pokemon-card'>
                <Card.Body className='d-flex justify-content-between align-items-center'>
                  <div className="left-side position-relative">
                    {team[index] ? (
                      <div className="pokemon-thumbnail-wrapper">
                        <img
                          src={team[index].image}
                          alt={team[index].name}
                          className="pokemon-thumbnail w-100"
                        />

                        <Button
                          variant="danger"
                          className="remove-overlay-btn"
                          onClick={() => handleRemove(index)}
                        >
                          <IoMdRemoveCircle size={48} />
                        </Button>
                      </div>
                    ) : (
                      <Form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(index); }}>
                        <div className="input-btn-wrapper position-relative">
                          <Form.Group className="mb-2">
                            <Form.Control
                              type="text"
                              placeholder="Buscar Pokémon"
                              value={searches[index]}
                              onChange={(e) => handleInputSuggestions(index, e.target.value)}
                              className="pokemon-search"
                            />
                          </Form.Group>

                          <Button
                            variant="dark"
                            type="submit"
                            disabled={loading[index]}
                            className="add-square-btn mt-2 position-relative"
                          >
                            {loading[index] ? <Spinner animation="border" size="sm" /> : <MdAdd size={26} />}
                          </Button>

                          {suggestions[index].length > 0 && (
                            <ListGroup className="suggestion-list">
                              {suggestions[index].map((p, i) => (
                                <ListGroup.Item
                                  key={i}
                                  action
                                  onClick={() => handleSuggestionClick(index, p.name)}
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
                        </div>
                      </Form>
                    )}
                  </div>

                  <div className='right-side d-flex flex-column'>
                    {pokemon && (
                      <>
                        <div className="mb-2 p-2 border rounded text-center w-100">
                          <p className="mb-1"><strong>Tipagem:</strong></p>
                          <div className="d-flex flex-wrap justify-content-center gap-1">
                            {pokemon.types.map((type, idx) => (
                              <span
                                key={idx}
                                className="type-badge"
                                style={{
                                  backgroundColor: typeColors?.[type] || '#777',
                                }}
                              >
                                {type.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="fraqueza-right-side p-2 border rounded text-center w-100">
                          <p className="mb-1"><strong>Fraquezas:</strong></p>
                          <div className="pokemon-weaknesses d-flex flex-wrap justify-content-center gap-1">
                            {Object.keys(typeColors).map((attackType, idx) => {
                              let multiplier = 1;
                              for (const defenseType of pokemon.types) {
                                const damageMap = typeCache.current?.[attackType];
                                const value = damageMap?.[defenseType] !== undefined ? damageMap?.[defenseType] : 1;
                                multiplier *= value;
                              }

                              if (multiplier > 1) {
                                return (
                                  <div
                                    key={idx}
                                    className="weakness-box d-flex flex-column justify-content-center align-items-center"
                                    style={{
                                      backgroundColor: typeColors?.[attackType] || '#aaa',
                                    }}
                                  >
                                    {attackType.substring(0, 3).toUpperCase()}
                                    <span style={{ fontSize: '10px' }}>{multiplier}x</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className='mb-4'>
          {team.slice(3, 6).map((pokemon, index) => (
            <Col key={index + 3} xs={12} sm={6} md={4}>
              <Card className='pokemon-card'>
                <Card.Body className='d-flex justify-content-between align-items-center'>
                  <div className="left-side position-relative">
                    {team[index + 3] ? (
                      <div className="pokemon-thumbnail-wrapper">
                        <img
                          src={team[index + 3].image}
                          alt={team[index + 3].name}
                          className="pokemon-thumbnail w-100"
                        />

                        <Button
                          variant="danger"
                          className="remove-overlay-btn"
                          onClick={() => handleRemove(index + 3)}
                        >
                          <IoMdRemoveCircle size={48} />
                        </Button>
                      </div>
                    ) : (
                      <Form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(index + 3); }}>
                        <div className="input-btn-wrapper position-relative">
                          <Form.Group className="mb-2">
                            <Form.Control
                              type="text"
                              placeholder="Buscar Pokémon"
                              value={searches[index + 3]}
                              onChange={(e) => handleInputSuggestions(index + 3, e.target.value)}
                              className="pokemon-search"
                            />
                          </Form.Group>

                          <Button
                            variant="dark"
                            type="submit"
                            disabled={loading[index + 3]}
                            className="add-square-btn mt-2 position-relative"
                          >
                            {loading[index + 3] ? <Spinner animation="border" size="sm" /> : <MdAdd size={26} />}
                          </Button>

                          {suggestions[index + 3].length > 0 && (
                            <ListGroup className="suggestion-list">
                              {suggestions[index + 3].map((p, i) => (
                                <ListGroup.Item
                                  key={i}
                                  action
                                  onClick={() => handleSuggestionClick(index + 3, p.name)}
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
                        </div>
                      </Form>
                    )}
                  </div>

                  <div className='right-side d-flex flex-column'>
                    {pokemon && (
                      <>
                        <div className="mb-2 p-2 border rounded text-center w-100">
                          <p className="mb-1"><strong>Tipagem:</strong></p>
                          <div className="d-flex flex-wrap justify-content-center gap-1">
                            {pokemon.types.map((type, idx) => (
                              <span
                                key={idx}
                                className="type-badge"
                                style={{
                                  backgroundColor: typeColors?.[type] || '#777',
                                }}
                              >
                                {type.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="fraqueza-right-side p-2 border rounded text-center w-100">
                          <p className="mb-1"><strong>Fraquezas:</strong></p>
                          <div className="pokemon-weaknesses d-flex flex-wrap justify-content-center gap-1">
                            {Object.keys(typeColors).map((attackType, idx) => {
                              let multiplier = 1;
                              for (const defenseType of pokemon.types) {
                                const damageMap = typeCache.current?.[attackType];
                                const value = damageMap?.[defenseType] !== undefined ? damageMap?.[defenseType] : 1;
                                multiplier *= value;
                              }

                              if (multiplier > 1) {
                                return (
                                  <div
                                    key={idx}
                                    className="weakness-box d-flex flex-column justify-content-center align-items-center"
                                    style={{
                                      backgroundColor: typeColors?.[attackType] || '#aaa',
                                    }}
                                  >
                                    {attackType.substring(0, 3).toUpperCase()}
                                    <span style={{ fontSize: '10px' }}>{multiplier}x</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <h3 className="mt-4 mb-3 text-center title">Fraquezas do Time</h3>
        <Row className="justify-content-center">
          {Object.keys(typeColors).map((type, idx) => {
            const pokemonsWithWeakness = (teamWeaknesses[type] || []).filter(p => p.multiplier > 1);

            const rawAverage = pokemonsWithWeakness.length > 0
              ? (pokemonsWithWeakness.reduce((acc, p) => acc + p.multiplier, 0) / pokemonsWithWeakness.length)
              : 1;

            const averageMultiplier = rawAverage % 1 === 0
              ? rawAverage.toFixed(0)
              : rawAverage.toFixed(2);

            return (
              <Col key={idx} xs={6} sm={4} md={3} lg={2} className="mb-3">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-${type}`}>
                      {pokemonsWithWeakness.length > 0
                        ? pokemonsWithWeakness.map((p, i) => (
                          <div key={i}>
                            {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: {p.multiplier}x
                          </div>
                        ))
                        : `Nenhum Pokémon no time é fraco a ${type}.`}
                    </Tooltip>
                  }
                >
                  <div
                    style={{
                      backgroundColor: typeColors[type] || '#555',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {type.toUpperCase()}
                    <br />
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>{averageMultiplier}x</span>
                  </div>
                </OverlayTrigger>
              </Col>
            );
          })}
        </Row>

        <Row>
          {admin && (
            <Col xs={12}>
              <div className="text-center mt-4 bg-light p-3 rounded">
                <h5>Visualização JSON (Apenas para Administradores)</h5>
                <pre className="text-start">
                  {JSON.stringify(
                    {
                      team: team.filter(p => p !== null),
                      searches,
                      teamWeaknesses
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </Col>
          )}
        </Row>
      </Container>
    </>
  );
}

export default Time;