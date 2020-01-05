import { view } from './view'
import { Token, Id } from '../lang'
import { intent } from './intent'
import { Status } from './Status'
import { updates } from './updates'
import xs, { Stream } from 'xstream'
import { StateSource } from '@cycle/state'
import { SelectionRange } from './SelectionRange'
import { PortalManagement } from './PortalManagement'
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
    id: Id
    target: number
  }
}

export type Reducer = (prev: State) => State | undefined

export function Editor(sources: Sources): Sinks {
  const portalManagement = PortalManagement(sources)
  const selectionRange = SelectionRange(sources)
  const status = Status(sources)

  const update$ = updates(intent(sources))
  return {
    DOM: view(sources.state.stream),
    state: xs.merge(
      update$,
      portalManagement.state,
      selectionRange.state,
      status.state,
    ),
  }
}
