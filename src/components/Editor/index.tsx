import xs, { Stream } from 'xstream';
import { BaseSources, BaseSinks } from '../../interfaces';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { Sonnets } from 'shakespeare-data/lib/data/sonnets';
import { intent } from './intent';
import { view } from './view';

const sonnets = new Sonnets();

// Types
export interface Sources extends BaseSources {
    onion: StateSource<State>;
}

export interface Sinks extends BaseSinks {
    onion?: Stream<Reducer>;
}


type LineCount = number;
type CharCount = number;

export interface Portal {
    start: LineCount;
    end: LineCount;
    width: CharCount;
    height: LineCount;
    top: LineCount;
    left: CharCount;
}

// State
export interface State {
    buffer: String;
    instances: Portal[];
    range: Portal | null;
    movable: Boolean;
    copiable: Boolean;
}

const defaultState: State = {
    instances: [],
    buffer: Array.from(Array(4))
        .map(() =>
            sonnets
                .random()
                .lines.slice(0, Math.round(Math.random() * 4) + 1)
                .join('\n')
        )
        .join('\n\n'),
    range: null,
    movable: false,
    copiable: false,
};
export type Reducer = (prev: State) => State | undefined;


export function Editor(sources: Sources): Sinks {
    const { onion } = sources
    const intents = intent(sources);
    const vdom$: Stream<VNode> = view(onion.state$);

    const createPortal$ = intents.create$
        .map(() => (state: State) => {
            if (!state.range) return state
            return {
                ...state,
                instances: state.instances.concat([state.range])
            };
        });

    const input$ = intents.input$
        .map(ev => (state: State) => {
            return {
                ...state,
                buffer: (ev.target as HTMLElement).textContent || ''
            };
        });


    const init$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    );

    return {
        DOM: vdom$,
        onion: xs.merge(
            input$,
            init$,
            intents.range$.map(range => (state: State) => ({ ...state, range })),
            intents.movable$.map(movable => (state: State) => ({ ...state, movable: Boolean(movable) })),
            intents.copiable$.map(copiable => (state: State) => ({ ...state, copiable: Boolean(copiable) })),
            createPortal$
        )
    };
}
