import './editor.scss'

import { view } from './view'
import { Token } from '../lang'
import { Stream } from 'xstream'
import { intent } from './intent'
import { updates } from './updates'
import { StateSource } from '@cycle/state'
import { BaseSources, BaseSinks } from '../interfaces'

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
  range: Array<[number, Token]> | undefined
  movable: boolean
  copiable: boolean
  disabled: boolean
  transform?: {
    target: number
    offset: number
  }
}

export type Reducer = (prev: State) => State | undefined

export function Editor(sources: Sources): Sinks {
  return {
    DOM: view(sources.state.stream),
    state: updates(intent(sources)),
  }
}
