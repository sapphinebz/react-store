import * as React from "react";
import { PokemonURL } from "../model/pokemon.model";

interface IPokemonsProps {
  pokemons?: PokemonURL[];
}

const Pokemons: React.FunctionComponent<IPokemonsProps> = React.memo(
  (props) => {
    const pokemonsNodes = React.useMemo(() => {
      const pokemons = props.pokemons ?? [];
      return pokemons.map((p) => {
        return <div key={p.name}>{p.name}</div>;
      });
    }, [props.pokemons]);

    return <React.Fragment>{pokemonsNodes}</React.Fragment>;
  }
);

export default Pokemons;
