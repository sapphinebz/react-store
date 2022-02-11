import * as React from "react";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  mergeAll,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  tap,
  toArray,
} from "rxjs";
import { httpGet } from "../http/http";
import {
  PokemonModel,
  PokemonPageResponse,
  PokemonURL,
} from "../model/pokemon.model";

interface IStoreProviderProps {}

interface AppState {
  counter: number;
  limit: number;
  offset: number;
  page: number;
  pokemonUrls: PokemonURL[];
  pokemons: PokemonModel[];
}

// --- Action ---

const increaseCounterAction = new Subject<{ value: number }>();
const decreaseCounterAction = new Subject<{ value: number }>();
const setPokemonUrlsAction = new Subject<{ pokemons: PokemonURL[] }>();
const setPokemonModelsAction = new Subject<{ pokemons: any[] }>();
const nextPageAction = new Subject<void>();
const prevPageAction = new Subject<void>();

const state = new BehaviorSubject<AppState>({
  counter: 0,
  limit: 10,
  offset: 0,
  page: 1,
  pokemonUrls: [],
  pokemons: [],
});

const store = {
  counter$: createSelector((state) => state.counter),
  page$: createSelector((state) => state.page),
  limit$: createSelector((state) => state.limit),
  offset$: createSelector((state) => state.offset),
  pokemonUrls$: createSelector((state) => state.pokemonUrls),
  pokemonModels$: createSelector((state) => state.pokemons),
};

const action = {
  increaseCounter: (value: number) => {
    increaseCounterAction.next({ value });
  },
  decreaseCounter: (value: number) => {
    decreaseCounterAction.next({ value });
  },
  nextPage: () => {
    nextPageAction.next();
  },
  prevPage: () => {
    prevPageAction.next();
  },
};

// --- Reducer ---
createReducer(increaseCounterAction, (state, action) => {
  state.counter += action.value;
  return state;
});

createReducer(decreaseCounterAction, (state, action) => {
  state.counter -= action.value;
  return state;
});

createReducer(nextPageAction, (state, action) => {
  state.offset += state.limit;
  state.page = calPage(state.limit, state.offset);
  return state;
});

createReducer(prevPageAction, (state, action) => {
  state.offset -= state.limit;
  state.page = calPage(state.limit, state.offset);
  return state;
});

createReducer(setPokemonUrlsAction, (state, action) => {
  state.pokemonUrls = action.pokemons;
  return state;
});

createReducer(setPokemonModelsAction, (state, action) => {
  state.pokemons = action.pokemons;
  return state;
});

// --- Effect ---

createEffect(
  combineLatest([store.limit$, store.offset$]).pipe(
    debounceTime(0),
    switchMap(([limit, offset]) => {
      return httpGet<PokemonPageResponse>(
        `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
      ).pipe(
        tap((response) => {
          setPokemonUrlsAction.next({ pokemons: response.results });
        })
      );
    }),
    switchMap((response) => {
      return from(response.results).pipe(
        map((result) => httpGet(result.url)),
        mergeAll(),
        toArray(),
        tap((response) => {
          setPokemonModelsAction.next({ pokemons: response });
        })
      );
    })
  )
);

const StoreContext = React.createContext(store);
const ActionContext = React.createContext(action);

export const StoreProvider: React.FunctionComponent<IStoreProviderProps> =
  React.memo((props) => {
    return (
      <ActionContext.Provider value={action}>
        <StoreContext.Provider value={store}>
          {props.children}
        </StoreContext.Provider>
      </ActionContext.Provider>
    );
  });

function createSelector<T>(selector: (data: AppState) => T) {
  return state.pipe(
    map((value) => {
      return selector(value);
    }),
    distinctUntilChanged(),
    shareReplay(1)
  );
}

function createReducer<T>(
  action$: Observable<T>,
  reducer: (state: AppState, action: T) => AppState
) {
  return action$.subscribe((action) => {
    const oldState = { ...state.value };
    const newState = reducer(oldState, action);
    state.next(newState);
  });
}

function createEffect<T>(effect$: Observable<T>) {
  effect$.subscribe();
}

export function useAction() {
  return React.useContext(ActionContext);
}

export function useStore() {
  return React.useContext(StoreContext);
}

export function useObservableHook<T, R = undefined>(
  source: Observable<T>,
  defaultValue?: R
): T | R;
export function useObservableHook<T, R extends T>(
  source: Observable<T>,
  defaultValue: R
): T | R {
  const [_state, _setState] = React.useState<T | R>(defaultValue);
  React.useEffect(() => {
    const subscription = source.subscribe((value) => {
      _setState(value);
    });
    return () => subscription.unsubscribe();
  }, [source]);
  return _state;
}

// --- Utility Function ---

function calPage(limit: number, offset: number) {
  return (offset + limit) / limit;
}
