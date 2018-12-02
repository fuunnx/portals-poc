import xs, { Stream } from 'xstream';
import { VNode, DOMSource } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import isolate from '@cycle/isolate';
import { extractSinks } from 'cyclejs-utils';

import { driverNames } from '../drivers';
import { BaseSources, BaseSinks } from '../interfaces';
import { RouteValue, routes, initialRoute } from '../routes';

import { State as PortalsState } from './editor';

export interface Sources extends BaseSources {
    onion: StateSource<State>;
}
export interface Sinks extends BaseSinks {
    onion?: Stream<Reducer>;
}

// State
export interface State {
    portals?: PortalsState;
}
export const defaultState: State = {
    portals: {
        instances: [],
        buffer: ''
    }
};
export type Reducer = (prev?: State) => State | undefined;

export function App(sources: Sources): Sinks {
    const initReducer$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    );

    const match$ = sources.router.define(routes);

    const componentSinks$ = match$.map(
        ({ path, value }: { path: string; value: RouteValue }) => {
            const { component, scope } = value;
            return isolate(component, scope)({
                ...sources,
                router: sources.router.path(path)
            });
        }
    );

    const sinks = extractSinks(componentSinks$, driverNames);
    return {
        ...sinks,
        onion: xs.merge(initReducer$, sinks.onion)
    };
}
