import './editor.scss'

import xs, { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { intent } from './intent'
import { view } from './view'
import { Dict, Token } from '../lang'
import { initialState } from './initialState'
import dropRepeats from 'xstream/extra/dropRepeats'

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
    range: Dict<Token> | undefined
    movable: Boolean
    copiable: Boolean
}


export type Reducer = (prev: State) => State | undefined


export function Editor(sources: Sources): Sinks {
    const { state } = sources
    const intents = intent(sources)
    const vdom$: Stream<VNode> = view(state.stream)

    // const createPortal$ = intents.create$
    //     .map(() => (currState: State) => {
    //         if (!currState.range) return currState
    //         return {
    //             ...currState,
    //             instances: currState.instances.concat([currState.range])
    //         }
    //     })

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
        prevState => (prevState === undefined ? initialState : prevState)
    )

    return {
        DOM: vdom$,
        state: xs.merge(
            input$,
            init$,
            intents.range$.map(range => (curr: State) => ({ ...curr, range })),
            intents.movable$.map(movable => (curr: State) => ({ ...curr, movable: Boolean(movable) })),
            intents.copiable$.map(copiable => (curr: State) => ({ ...curr, copiable: Boolean(copiable) }))
        )
    }
}
