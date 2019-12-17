import './editor.scss'

import { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { intent } from './intent'
import { view } from './view'
import { Token } from '../lang'
import { updates } from './updates'

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
