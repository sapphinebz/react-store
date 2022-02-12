import { from, map, catchError, EMPTY, mergeAll, toArray } from "rxjs";
import { PokemonPageResponse, PokemonURL } from "../model/pokemon.model";
import { httpGet } from "./http";

export function getPokemonByPaginator(limit: number, offset: number) {
  return httpGet<PokemonPageResponse>(
    `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
  );
}

export function getPokemonModels(results: PokemonURL[]) {
  return from(results).pipe(
    map((result) => httpGet(result.url).pipe(catchError((err) => EMPTY))),
    mergeAll(),
    toArray()
  );
}
