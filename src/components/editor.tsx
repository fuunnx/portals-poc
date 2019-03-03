import xs, { Stream } from 'xstream';
import { VNodeStyle } from 'snabbdom/modules/style';
import { BaseSources, BaseSinks } from '../interfaces';
import sampleCombine from 'xstream/extra/sampleCombine';
import { VNode } from '@cycle/dom';
import { StateSource } from 'cycle-onionify';

export function Editor({ DOM, onion, selection }: Sources): Sinks {
    const action$: Stream<Reducer> = intent(/* DOM */);
    const vdom$: Stream<VNode> = view(onion.state$);

    const selection$ = selection.selections();
    // const range$ = selection.selections().filter(x => x.type === 'Range');
    // const caret$ = selection.selections().filter(x => x.type === 'Caret');

    function startDragging(target: string) {
        return DOM.select(target)
            .events('mousedown')
            .filter(e => e.altKey)
            .map(x =>
                move$()
                    .take(1)
                    .mapTo(x)
            )
            .flatten();
    }

    const createPortal$ = startDragging('document')
        .compose(sampleCombine(selection$, onion.state$))
        .filter(([, selec]) => selec.type === 'Range')
        .map(([event, selec, { buffer }]) => {
            const range = selec.getRangeAt(0);
            const allLines = buffer.split('\n');
            const start = init(buffer.slice(0, range.startOffset).split('\n'))
                .length;
            const height = buffer
                .slice(range.startOffset, range.endOffset)
                .trim()
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
                    id: Math.random()
                        .toString(16)
                        .split('.')[1],
                    start,
                    end: start + height,
                    height,
                    width: width === left ? width : width - left,
                    top: start,
                    left: width === left ? left : 0
                }
            };
        });

    const dragStart$ = startDragging('[data-portal-id]')
        .debug('starting')
        .compose(sampleCombine(selection$, onion.state$.map(x => x.instances)))
        .filter(([, selec]) => selec.type !== 'Range')
        .map(([event, , instances]) => ({
            event,
            portal: instances.find(
                portal =>
                    portal.id === (event.target as HTMLElement).dataset.portalId
            )
        }))
        .filter(x => Boolean(x.portal));

    const movePortal$ = xs
        .merge(createPortal$, dragStart$)
        .map(({ event, portal: portal_ }) => {
            const portal = portal_ as Portal; // wtf can't be undefined here
            const start = { x: event.clientX, y: event.clientY };
            event.target && (event.target as HTMLElement).blur();

            return move$()
                .map(e => (p: Portal) => ({
                    ...p,
                    left: portal.left + toCH(e.clientX - start.x),
                    top: portal.top + toLH(e.clientY - start.y)
                }))
                .map(fn => (state: State) => ({
                    ...state,
                    instances: state.instances.map(
                        p => (p.id === portal.id ? fn(p) : p)
                    )
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

    const dragMode$ = xs
        .merge(
            DOM.select('document')
                .events('keydown')
                .filter(x => x.altKey)
                .mapTo(true),
            DOM.select('document')
                .events('keyup')
                .filter(x => x.altKey)
                .mapTo(false)
        )
        .map(down => (state: State) =>
            ({
                ...state,
                mode: down ? 'drag' : 'edit'
            } as State)
        );

    return {
        DOM: vdom$,
        onion: xs.merge(
            input$,
            action$,
            dragMode$,
            createPortal$.map(({ portal }) => (state: State) => ({
                ...state,
                instances: state.instances.concat([portal])
            })),
            movePortal$
        )
    };
}

function intent(/* DOM: DOMSource */): Stream<Reducer> {
    const init$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    );

    return xs.merge(init$);
}

function view(state$: Stream<State>): Stream<VNode> {
    return state$.map(({ instances, buffer }) => {
        const lines = buffer.split('\n').reduce((acc, line, i): Array<
            string | JSX.Element
        > => {
            const prev = last(acc);
            const prevIsVisible = typeof prev === 'string' || i === 0;
            const lineIsVisible = !instances.some(
                x => x.start <= i && x.end > i
            );

            if (prevIsVisible && !lineIsVisible) {
                return [...acc, hiddenLine(line)];
            }
            if (!prevIsVisible && lineIsVisible) {
                return [...acc, line];
            }
            if (prevIsVisible && lineIsVisible) {
                return [...init(acc), (prev || '') + '\n' + line];
            }
            if (!prevIsVisible && !lineIsVisible) {
                return [
                    ...init(acc),
                    {
                        ...prev,
                        children: (prev.children || []).concat([
                            <br />,
                            <div>line</div>
                        ])
                    }
                ];
            }

            return acc;
        }, []);
        return (
            <div className="editor">
                <Buffer
                    style={{
                        '--height': String(buffer.split('\n').length)
                    }}
                >
                    {lines}
                </Buffer>
                {instances.map(portal => {
                    const res = (
                        <Buffer
                            data-portalId={portal.id}
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
                    );
                    console.log(res);
                    return res;
                })}
            </div>
        );
    });
}

function hiddenLine(line: string) {
    return (
        <div
            className="_collapsed"
            style={{
                'max-height': 'var(--lh)',
                overflow: 'hidden',
                background: 'rgb(0, 100, 255)',
                color: 'transparent'
            }}
        >
            {line}
        </div>
    );
}
function Buffer(
    args: {
        className?: String;
        style?: VNodeStyle;
        start?: number;
        data?: Record<string, string | number | boolean>;
        props?: Object;
        attrs?: Record<string, string | number | boolean>;
    },
    children: JSX.Element[]
) {
    const { className, style, start = 0 } = args;

    return (
        <pre
            {...args}
            style={style}
            className={[className, 'buffer'].filter(Boolean).join(' ')}
            attrs-contenteditable={true}
            attrs-spellcheck={false}
            scrolltop={fromLH(start)}
            hook={{
                insert: vnode => {
                    if (vnode.elm) {
                        (vnode.elm as HTMLElement).scrollTop = fromLH(start);
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
    id: String;
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
    mode: 'drag' | 'edit' | undefined;
}

export const defaultState: State = {
    mode: 'edit',
    instances: [],
    buffer: `
function fibonnaci (n) {
    if (n === 1) {
        return 1
    }
    return n + fibonnaci(n - 1)
}

fibonnaci(5) // = 15

html\`
<grid columns="3">
    <card>
        <img src="jean-maurice.jpg" />
        <h2>Jean Maurice</h2>
    </card>
    <card>
        <img src="mauricette.jpg" />
        <h2>Mauricette</h2>
    </card>
    <card>
        <img src="albert.jpg" />
        <h2>Albert</h2>
    </card>
</grid>
\`
`
};

export type Reducer = (prev: State) => State | undefined;

function toLH(px: number) {
    return Math.round(px / 25);
}
function fromLH(lh: number) {
    return lh * 25;
}
function toCH(px: number) {
    return Math.round(px / 12);
}
// function fromCH(ch: number) {
//     return ch * 12;
// }

function init<T>(arr: T[]) {
    const len = arr.length;
    return len === 0 ? [] : arr.slice(0, len - 1);
}

function last(array: any[]): any {
    return array[array.length - 1];
}
