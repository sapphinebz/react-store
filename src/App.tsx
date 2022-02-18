import React from "react";
import "./App.css";
import PokemonModels from "./components/pokemon-models";
import { useAction, useObservableState, useStore } from "./store/store";

function App() {
  const store = useStore();
  const action = useAction();
  const page = useObservableState(store.pokemon.page$);
  const totalPage = useObservableState(store.pokemon.totalPage$);
  const pokemonModels = useObservableState(store.pokemon.pokemonModels$, []);

  return (
    <div className="App">
      <div>
        page: {page} / {totalPage}
      </div>
      <div>
        <button onClick={() => action.prevPage()}>prevPage</button>
        <button onClick={() => action.nextPage()}>nextPage</button>
      </div>
      <div style={{ display: "flex" }}>
        <PokemonModels pokemons={pokemonModels}></PokemonModels>
      </div>
    </div>
  );
}

export default App;
