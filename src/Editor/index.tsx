import './editor.scss'

import xs, { Stream } from 'xstream'
import { BaseSources, BaseSinks } from '../interfaces'
import { VNode } from '@cycle/dom'
import { StateSource } from '@cycle/state'
import { intent } from './intent'
import { view } from './view'
import { Token, parse, stringify } from '../lang'
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
  const { state } = sources
  const intents = intent(sources)
  const vdom$: Stream<VNode> = view(state.stream)

  const input$ = intents.input$
    .compose(dropRepeats())
    .map(buffer => (currState: State) => {
      return {
        ...currState,
        buffer,
      }
    })

  const init$ = xs.of<Reducer>(prevState =>
    prevState === undefined ? initialState : prevState,
  )

  return {
    DOM: vdom$,
    state: xs.merge(
      input$,
      init$,
      intents.togglePreview$,
      intents.startMoving$.map(transform => (curr: State) => {
        return {
          ...curr,
          transform: Number.isFinite(transform.id)
            ? {
                target: transform.id,
                offset: transform.y - transform.id,
              }
            : undefined,
        }
      }),

      intents.range$.map(range => (curr: State) => ({ ...curr, range })),
      intents.movable$.map(movable => (curr: State) => ({
        ...curr,
        movable: Boolean(movable),
      })),
      intents.copiable$.map(copiable => (curr: State) => ({
        ...curr,
        copiable: Boolean(copiable),
      })),

      intents.commit$.mapTo(currState => {
        const parsed = parse(currState.buffer, {
          add: currState.movable ? currState.range : [],
          move: currState.transform,
        })

        return {
          ...currState,
          movable: false,
          transform: undefined,
          buffer: stringify(parsed),
        }
      }),
    ),
  }
}
