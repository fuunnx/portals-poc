import xs, { Stream } from 'xstream';
import { VNodeStyle } from 'snabbdom/modules/style';
import { BaseSources, BaseSinks } from '../interfaces';
import sampleCombine from 'xstream/extra/sampleCombine';
import { VNode, DOMSource, li, textarea } from '@cycle/dom';
import { StateSource, makeCollection } from 'cycle-onionify';
import { Sonnets } from 'shakespeare-data/lib/data/sonnets';

const sonnets = new Sonnets();

export function Editor({ DOM, onion, selection }: Sources): Sinks {
    const action$: Stream<Reducer> = intent(DOM);
    const vdom$: Stream<VNode> = view(onion.state$);

    const selection$ = selection.selections();
    const range$ = selection.selections().filter(x => x.type === 'Range');
    const caret$ = selection.selections().filter(x => x.type === 'Caret');

    const createPortal$ = DOM.select('document')
        .events('mousedown')
        .filter(e => e.altKey)
        .compose(sampleCombine(selection$, onion.state$))
        .filter(([, selection]) => selection.type === 'Range')
        .map(x =>
            move$()
                .take(1)
                .mapTo(x)
        )
        .flatten()
        .debug(([, selection]) =>
            console.log({ string: selection.getRangeAt(0) })
        )
        .map(([event, selection, { buffer }]) => {
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

            console.log(width);

            return {
                event,
                portal: {
                    start,
                    end: start + height,
                    height,
                    width: width === left ? width : width - left,
                    top: start,
                    left: width === left ? left : 0
                }
            };
        })
        .debug('createPortal');

    const movePortal$ = xs
        .merge(createPortal$)

        .map(({ event, portal }) => {
            const start = {
                x: event.clientX,
                y: event.clientY
            };

            return move$().map(e => ({
                x: start.x - e.clientX,
                y: start.y - e.clientY
            }));
        })
        .flatten()
        .debug('movePortal');

    function move$() {
        return DOM.select('document')
            .events('mousemove')
            .endWhen(
                xs.merge(
                    DOM.select('document').events('mouseup'),
                    DOM.select('window').events('blur')
                )
            );
    }

    const input$ = DOM.select('document')
        .events('input')
        .map(ev => (state: State) => {
            return {
                ...state,
                buffer: (ev.target as HTMLElement).textContent || ''
            };
        });

    return {
        DOM: vdom$,
        onion: xs.merge(
            input$,
            action$,
            createPortal$.map(({ portal }) => (state: State) => ({
                ...state,
                instances: state.instances.concat([portal])
            }))
        )
    };
}

function intent(DOM: DOMSource): Stream<Reducer> {
    const init$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    );

    return xs.merge(init$);
}

function view(state$: Stream<State>): Stream<VNode> {
    return state$.map(({ instances, buffer }) => (
        <div className="editor">
            <Buffer style={{ '--height': String(buffer.split('\n').length) }}>
                {buffer}
            </Buffer>
            {instances.map(portal => (
                <Buffer
                    className="portal"
                    start={portal.start}
                    style={{
                        '--start': String(portal.start),
                        '--end': String(portal.end),
                        '--height': String(portal.height),
                        '--width': String(portal.width),
                        '--top': String(portal.top),
                        '--left': String(portal.left)
                    }}
                >
                    {buffer}
                </Buffer>
            ))}
        </div>
    ));
}

function Buffer(
    {
        className,
        style,
        start = 0
    }: { className?: String; style?: VNodeStyle; start?: number },
    children: JSX.Element[]
) {
    console.log(25 * start);
    return (
        <pre
            style={style}
            className={[className, 'buffer'].filter(Boolean).join(' ')}
            attrs-contenteditable={true}
            attrs-spellcheck={false}
            scrolltop={25 * start}
            hook={{
                insert: vnode => {
                    if (vnode.elm) {
                        (vnode.elm as HTMLElement).scrollTop = 25 * start;
                    }
                }
            }}
        >
            {children}
        </pre>
    );
}

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
export const defaultState: State = {
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

function init<T>(arr: T[]) {
    const len = arr.length;
    return len === 0 ? [] : arr.slice(0, len - 1);
}
