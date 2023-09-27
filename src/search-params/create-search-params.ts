/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

type ParamConfig<T> = {
  encode: (value: T) => string;
  decode: (rawValue: string) => T;
};

type SearchParamsConfig<T extends Record<string, ParamConfig<any>>> = {
  prefix: string;
  params: T;
};

type SearchParams<T extends Record<string, ParamConfig<any>>> = {
  [K in keyof T]?: ReturnType<T[K]['decode']>;
};

type SearchParamsPatch<T extends Record<string, ParamConfig<any>>> = {
  [K in keyof T]?: ReturnType<T[K]['decode']> | null;
};

type UpdateOptions = { replace?: boolean };
type SearchParamsResult<T extends Record<string, ParamConfig<any>>> = {
  select: <TReturn>(
    selector: (value: SearchParams<T>) => TReturn,
    isEqual?: (o1?: TReturn, o2?: TReturn) => boolean
  ) => TReturn;
  update: (patch: SearchParamsPatch<T>, options?: UpdateOptions) => void;
  useSelector: <TReturn>(
    selector: (value: SearchParams<T>) => TReturn,
    isEqual?: (o1?: TReturn, o2?: TReturn) => boolean
  ) => TReturn;
};

export const stringParam = (): ParamConfig<string> => ({
  decode: (rawValue: string) => rawValue,
  encode: (value: string) => value,
});

export const numberParam = (): ParamConfig<number> => ({
  decode: (rawValue: string) => parseFloat(rawValue),
  encode: (value: number) => `${value}`,
});

export type Config = {
  setSearchParams: (query: URLSearchParams, replace: boolean) => void;
};

const defaultSearchParamsConfig: Config = {
  setSearchParams: (query, replace) => {
    if (replace) {
      window.history.replaceState(window.history.state, document.title, `?${query.toString()}`);
    } else {
      window.history.pushState(window.history.state, document.title, `?${query.toString()}`);
    }
  },
};
const searchParamsConfig: Config = {
  ...defaultSearchParamsConfig,
};

export const configureSetSearchParams = (setSearchParams: Config['setSearchParams']) => {
  searchParamsConfig.setSearchParams = (query, replace) => {
    try {
      setSearchParams(query, replace);
    } catch (err) {
      defaultSearchParamsConfig.setSearchParams(query, replace);
    }
  };
};

export const createSearchParams = <T extends Record<string, ParamConfig<any>>>(
  config: SearchParamsConfig<T>
): SearchParamsResult<T> => {
  const keys = Object.keys(config.params);
  const prefixedKey = (k: string) => `${config.prefix}-${k}`;
  const select = <R>(selector: (v: SearchParams<T>) => R) => {
    const sp = new URLSearchParams(window.location.search);
    const v = keys.reduce((prev, curr) => {
      const k = prefixedKey(curr);
      const rawValue = sp.get(k);
      if (sp.has(k) && rawValue !== null) {
        // eslint-disable-next-line no-param-reassign
        prev[curr] = config.params[curr].decode(rawValue);
      }
      return prev;
    }, {} as any);
    return selector(v);
  };
  return {
    select,
    update: (patch: SearchParamsPatch<T>, options?: UpdateOptions) => {
      const sp = new URLSearchParams(window.location.search);
      Object.keys(patch).forEach((k) => {
        if (patch[k] === null) {
          sp.delete(prefixedKey(k));
        } else if (patch[k] !== undefined) {
          sp.set(prefixedKey(k), config.params[k].encode(patch[k]));
        }
      });
      searchParamsConfig.setSearchParams(sp, options?.replace ?? false);
    },
    useSelector: <R>(
      selector: (v: SearchParams<T>) => R,
      isEqual: (o1?: R, o2?: R) => boolean = (o1, o2) => o1 === o2
    ) => {
      const [value, setValue] = useState(select(selector));
      useEffect(() => {
        const onChange = () => {
          const newValue = select(selector) as any;
          setValue((prev) => (isEqual(prev, newValue) ? prev : newValue));
        };
        const events = ['popstate', 'pushstate', 'replacestate'];
        events.forEach((e) => window.addEventListener(e, onChange));
        return () => {
          events.forEach((e) => window.removeEventListener(e, onChange));
        };
      }, []);
      return value;
    },
  } as never;
};
