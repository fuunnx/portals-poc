import xs from 'xstream'
import { Intents } from './intent'
import { State, Reducer } from './index'
import { initialState } from './initialState'
import { parse, stringify } from '../lang'
import dropRepeats from 'xstream/extra/dropRepeats'
import { stateToAST } from './view/viewModel'

export function updates(intents: Intents) {
  const init$ = xs.of<Reducer>(prevState =>
    prevState === undefined ? initialState : prevState,
  )

  const input$ = intents.input$
    .compose(dropRepeats())
    .map(buffer => (currState: State) => {
      return {
        ...currState,
        buffer,
      }
    })

  const commit$ = intents.commit$.mapTo((currState: State) => {
    const newBuffer = stringify(stateToAST(currState))

    return {
      ...currState,
      movable: false,
      transform: undefined,
      buffer: newBuffer,
    }
  })

  return xs.merge(input$, init$, commit$)
}
