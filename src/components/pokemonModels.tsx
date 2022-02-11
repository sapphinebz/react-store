import * as React from "react";
import { PokemonModel } from "../model/pokemon.model";

interface IPokemonModelsProps {
  pokemons?: PokemonModel[];
}

const PokemonModels: React.FunctionComponent<IPokemonModelsProps> = React.memo(
  (props) => {
    const pokemonNodes = React.useMemo(() => {
      const pokemons = props.pokemons || [];
      return pokemons.map((p) => (
        <div>
          <div>{p.name}</div>
          <div>
            <img src={p.sprites.front_default} alt={p.name} />
          </div>
        </div>
      ));
    }, [props.pokemons]);
    return <React.Fragment>{pokemonNodes}</React.Fragment>;
  }
);

export default PokemonModels;
