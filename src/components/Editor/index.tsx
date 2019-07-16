import xs, { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../../interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { intent } from './intent'
import { view } from './view'
import { PortalInstance } from '../../parser'
import dropRepeats from 'xstream/extra/dropRepeats';

// Types
export interface Sources extends BaseSources {
    state: StateSource<State>
}

export interface Sinks extends BaseSinks {
    state?: Stream<Reducer>
}


// State
export interface State {
    buffer: string
    instances: Array<PortalInstance>
    range: PortalInstance | null
    movable: Boolean
    copiable: Boolean
}

const defaultState: State = {
    instances: [],
    range: null,
    movable: false,
    copiable: false,
    buffer: `
// PORTAL #fibonnaci
function fibonnaci (n) {
    // PORTAL #2
    if (n === 1) {
        return 1
    }
    // /PORTAL #2
    // PORTAL #3
    return n + fibonnaci(n - 1)
    // /PORTAL #3
    // WARP #2
}
// /PORTAL #fibonnaci
 
fibonnaci(5) // = 15
// WARP #fibonnaci


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
}
export type Reducer = (prev: State) => State | undefined


export function Editor(sources: Sources): Sinks {
    const { state } = sources
    const intents = intent(sources)
    const vdom$: Stream<VNode> = view(state.stream)

    const createPortal$ = intents.create$
        .map(() => (currState: State) => {
            if (!currState.range) return currState
            return {
                ...currState,
                instances: currState.instances.concat([currState.range])
            }
        })

    const input$ = intents.input$
        .map(ev => (ev.target as HTMLInputElement).value || '')
        .compose(dropRepeats())
        .map(buffer => (currState: State) => {
            return {
                ...currState,
                buffer,
            }
        })


    const init$ = xs.of<Reducer>(
        prevState => (prevState === undefined ? defaultState : prevState)
    )

    return {
        DOM: vdom$,
        state: xs.merge(
            input$,
            init$,
            intents.range$.map(range => (curr: State) => ({ ...curr, range })),
            intents.movable$.map(movable => (curr: State) => ({ ...curr, movable: Boolean(movable) })),
            intents.copiable$.map(copiable => (curr: State) => ({ ...curr, copiable: Boolean(copiable) })),
            createPortal$
        )
    }
}
