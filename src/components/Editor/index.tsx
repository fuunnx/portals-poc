import xs, { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../../interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { intent } from './intent'
import { view } from './view'

// Types
export interface Sources extends BaseSources {
    state: StateSource<State>
}

export interface Sinks extends BaseSinks {
    state?: Stream<Reducer>
}

type LineCount = number
type CharCount = number

export interface Portal {
    start: LineCount
    end: LineCount
    width: CharCount
    height: LineCount
    top: LineCount
    left: CharCount
}

// State
export interface State {
    buffer: String
    instances: Portal[]
    range: Portal | null
    movable: Boolean
    copiable: Boolean
}

const defaultState: State = {
    instances: [],
    range: null,
    movable: false,
    copiable: false,
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
        .map(ev => (currState: State) => {
            return {
                ...currState,
                buffer: (ev.target as HTMLElement).textContent || ''
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
