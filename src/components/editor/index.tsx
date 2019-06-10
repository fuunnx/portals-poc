import xs, { Stream } from 'xstream';
import { BaseSources, BaseSinks } from '../../interfaces';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';
import { Sonnets } from 'shakespeare-data/lib/data/sonnets';
import { intent } from './intent';
import { view } from './view';
import { init } from '../../libs/array';

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
        .join('\n\n')
};
export type Reducer = (prev: State) => State | undefined;


export function Editor(sources: Sources): Sinks {
    const { onion } = sources
    const intents = intent(sources);
    const vdom$: Stream<VNode> = view(onion.state$);

    const createPortal$ = intents.createPortal$
        .map(({ selection }) => (state: State) => {
            const { buffer } = state
            const range = selection.getRangeAt(0);
            const allLines = buffer.split('\n');
            const start = init(buffer.slice(0, range.startOffset).split('\n'))
                .length;
            const height = buffer
                .slice(range.startOffset, range.endOffset)
                .split('\n').length;
            const end = start + height;
            const selected = allLines.slice(start, end);

            const left = selected
                .map(x => (x.match(/^\s+/) || [''])[0].length)
                .reduce((a, b) => Math.min(a, b), Infinity);

            const width = selected
                .map(x => x.length)
                .reduce((a, b) => Math.max(a, b), 1);

            return {
                ...state,
                instances: state.instances.concat({
                    start,
                    end: start + height,
                    height,
                    width: width === left ? width : width - left,
                    top: start,
                    left: width === left ? left : 0
                })
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
            createPortal$
        )
    };
}
