/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, ReactNode, useContext, useEffect } from 'react';

import { AnyCaseReducers, createReducer, ReducerOptions } from '../reducer/create-reducer';

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyProps = {};

export const createReducerContext = <State, Reducers extends AnyCaseReducers<State>>(
  opts: ReducerOptions<State, Reducers>
) => {
  const reducer = createReducer(opts);
  type ActionDispatch = ReturnType<(typeof reducer)['useReducer']>[1];

  const StateContext = createContext(opts.initialState);
  const DispatchContext = createContext<ActionDispatch>(() => {
    console.debug('do nothing');
  });

  const ContextProvider = (props: { children: ReactNode }) => {
    const [state, dispatch] = reducer.useReducer();
    return (
      <DispatchContext.Provider value={dispatch}>
        <StateContext.Provider value={state}>{props.children}</StateContext.Provider>
      </DispatchContext.Provider>
    );
  };

  const useValue = () => {
    return useContext(StateContext);
  };

  const useActionDispatch = () => {
    return useContext(DispatchContext);
  };

  const useActionOnMount = (action: (dispatch: ActionDispatch) => void | (() => void)) => {
    const dispatch = useActionDispatch();
    useEffect(() => {
      return action(dispatch);
    }, []);
  };

  const useActionOnUnMount = (action: (dispatch: ActionDispatch) => void | (() => void)) => {
    const dispatch = useActionDispatch();
    useEffect(() => {
      return () => {
        action(dispatch);
      };
    }, []);
  };

  type StateSelector<R> = (s: State) => R;
  const useSelector = <R,>(selector: StateSelector<R>) => {
    const value = useValue();
    return selector(value);
  };

  const withContextProvider =
    <P = EmptyProps,>(Component: React.FC<P>) =>
    (props: P) => (
      <ContextProvider>
        <Component {...(props as any)} />
      </ContextProvider>
    );

  return {
    ContextProvider,
    useSelector,
    useValue,
    useActionDispatch,
    useActionOnMount,
    useActionOnUnMount,
    withContextProvider,
    actions: reducer.actions,
  };
};
