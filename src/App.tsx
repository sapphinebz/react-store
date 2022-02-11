import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useAction, useObservableHook, useStore } from "./store/store";
import { PokemonURL } from "./model/pokemon.model";
import Pokemons from "./components/pokemonUrls";
import PokemonModels from "./components/pokemonModels";

function App() {
  const store = useStore();
  const action = useAction();
  const counter = useObservableHook(store.counter$);
  const page = useObservableHook(store.page$);
  const pokemonModels = useObservableHook(store.pokemonModels$);

  return (
    <div className="App">
      <div>counter: {counter}</div>
      <div>
        <button
          onClick={() => {
            action.increaseCounter(10);
          }}
        >
          increase
        </button>
        <button
          onClick={() => {
            action.decreaseCounter(10);
          }}
        >
          decrease
        </button>
      </div>
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
