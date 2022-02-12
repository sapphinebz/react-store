import React from "react";
import "./App.css";
import PokemonModels from "./components/pokemon-models";
import { useAction, useObservableHook, useStore } from "./store/store";

function App() {
  const store = useStore();
  const action = useAction();
  const page = useObservableHook(store.page$);
  const pokemonModels = useObservableHook(store.pokemonModels$);

  return (
    <div className="App">
      <div>page: {page}</div>
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
