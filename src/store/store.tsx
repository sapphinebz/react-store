import * as React from "react";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  combineLatestWith,
  debounceTime,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  mapTo,
  merge,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { getPokemonByPaginator, getPokemonModels } from "../http/http-pokemon";
import { PokemonModel, PokemonURL } from "../model/pokemon.model";

interface IStoreProviderProps {}

interface AppState {
  limit: number;
  offset: number;
  page: number;
  totalPage: number | null;
  pokemonUrls: PokemonURL[];
  pokemons: PokemonModel[];
  loading: boolean;
}

// --- Action ---

const increaseCounterAction = new Subject<{ value: number }>();
const decreaseCounterAction = new Subject<{ value: number }>();
const setPokemonUrlsAction = new Subject<{ pokemons: PokemonURL[] }>();
const setPokemonModelsAction = new Subject<{ pokemons: any[] }>();
const nextPageAction = new Subject<void>();
const prevPageAction = new Subject<void>();
const showLoadingAction = new Subject<void>();
const hideLoadingAction = new Subject<void>();
const setLoadingAction = new Subject<boolean>();
const setTotalPageAction = new Subject<{ total: number }>();
const setPokemonCountAction = new Subject<{ count: number }>();

const state = new BehaviorSubject<AppState>({
  limit: 10,
  offset: 0,
  page: 1,
  totalPage: null,
  pokemonUrls: [],
  pokemons: [],
  loading: false,
});

const store = {
  pokemon: {
    page$: createSelector((state) => state.page),
    limit$: createSelector((state) => state.limit),
    offset$: createSelector((state) => state.offset),
    totalPage$: createSelector((state) => state.totalPage),
    pokemonUrls$: createSelector((state) => state.pokemonUrls),
    pokemonModels$: createSelector((state) => state.pokemons),
  },
  loading$: createSelector((state) => state.loading),
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
  rxShowLoading: <T,>() => {
    return (source: Observable<T>) =>
      new Observable<T>((observer) => {
        showLoadingAction.next();
        return source
          .pipe(
            finalize(() => {
              hideLoadingAction.next();
            })
          )
          .subscribe(observer);
      });
  },
};

// --- Reducer ---

createReducer(nextPageAction, (state, action) => {
  state.offset += state.limit;
  state.page = calPage(state.limit, state.offset);
  return state;
});

createReducer(prevPageAction, (state, action) => {
  const newOffset = state.offset - state.limit;
  if (newOffset >= 0) {
    state.offset = newOffset;
    state.page = calPage(state.limit, state.offset);
  }
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

createReducer(setLoadingAction, (state, loading) => {
  state.loading = loading;
  return state;
});

createReducer(setTotalPageAction, (state, action) => {
  state.totalPage = action.total;
  return state;
});

// --- Effect ---

createEffect(
  setPokemonCountAction.pipe(
    combineLatestWith(store.pokemon.limit$),
    debounceTime(0),
    tap(([action, limit]) => {
      const totalPage = Math.ceil(action.count / limit);
      setTotalPageAction.next({ total: totalPage });
    })
  )
);

createEffect(
  createObservableLoading(showLoadingAction, hideLoadingAction).pipe(
    tap((loading) => {
      setLoadingAction.next(loading);
    })
  )
);

createEffect(
  combineLatest([store.pokemon.limit$, store.pokemon.offset$]).pipe(
    debounceTime(300),
    switchMap(([limit, offset]) => {
      return getPokemonByPaginator(limit, offset).pipe(
        action.rxShowLoading(),
        tap((response) => {
          setPokemonCountAction.next({ count: response.count });
          setPokemonUrlsAction.next({ pokemons: response.results });
        }),
        catchError((err) => EMPTY)
      );
    }),
    switchMap((response) => {
      return getPokemonModels(response.results).pipe(
        action.rxShowLoading(),
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

export function useObservableState<TState>(
  source: Observable<TState>,
  defaultValue?: TState
): TState;
export function useObservableState<TState = undefined>(
  source: Observable<TState>
): TState | undefined {
  const defaultValue = arguments[1];
  const [_state, _setState] = React.useState<TState>(defaultValue);
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

function createObservableLoading(
  showLoading$: Observable<void>,
  hideLoading$: Observable<void>
) {
  let show = 0;
  const show$ = showLoading$.pipe(
    tap(() => {
      show++;
    }),
    mapTo(true)
  );
  const hide$ = hideLoading$.pipe(
    tap(() => {
      show--;
    }),
    filter(() => show === 0),
    delay(300),
    mapTo(false)
  );
  return merge(show$, hide$).pipe(distinctUntilChanged());
}
