import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import "./css/NotFound.css";
import { GiReturnArrow } from "react-icons/gi";
import Loading from "./Loading";
import { envioEmail } from "../assets/envioEmail";


function NotFound({ children }) {
    const [showLoader, setShowLoader] = useState(true);
    const minLoadingTime = 0;

    const handleFinishLoading = () => {
        setShowLoader(false);
    };
    
    const navigate = useNavigate();
    const pagina = "Página não encontrada";
    document.title = pagina;
    document.querySelector("meta[name='description']").setAttribute("content", pagina);
    const [pokemonUrl, setPokemonUrl] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);

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

    const hasSentLog = useRef(false);  

    useEffect(() => {
        fetchPokemon();
        import('./Loading');

        if (!hasSentLog.current) {
            envioEmail("Página não encontrada");
            hasSentLog.current = true;
        }
    }, []);

    if (showLoader) {
        return <Loading minTime={minLoadingTime} onFinish={handleFinishLoading} />;
    }

    return (
        <Container>


            <Row className="justify-content-center align-items-center m-5">
                <Col xs={10} md={4}>
                    <div className="login-image-container">
                        <div className="login-title">ERROR</div>
                        <div className="form-top">
                            <div className="form-login text-center">{children}</div>                            
                            <div className="form-login text-center">Clique no botão abaixo para retornar a página anterior</div>                            
                        </div>

                        <Form className="pokedex-form-on-image">
                            {pokemonUrl && (
                                <img
                                    key={animationKey}
                                    src={pokemonUrl}
                                    alt="Pokémon andando"
                                    className="pokemon-walk wiggle"
                                    onAnimationEnd={fetchPokemon}
                                />
                            )}

                            <div className="form-bottom">
                                <div className="button-wrapper">
                                    <Button variant="warning" className="login-button-on-image" onClick={() => navigate(-1)} >
                                        <GiReturnArrow size={32} />
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default NotFound