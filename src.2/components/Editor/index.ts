import { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../../../src/interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { view } from './view'
import { update } from './update'
import { Reducer } from './update'
import { intent } from './intent'

export function Editor(sources: Sources): Sinks {
    const action$: Stream<Reducer> = update(intent(sources))
    const vdom$: Stream<VNode> = view(sources.state.stream)

    return { DOM: vdom$, state: action$ }
}

type LineCount = number
type CharCount = number

export interface Portal {
    id: string
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
    mode: 'drag' | 'edit' | undefined
}

// Types
export interface Sources extends BaseSources {
    state: StateSource<State>
}
export interface Sinks extends BaseSinks {
    state?: Stream<Reducer>
}
