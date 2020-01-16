import { Intents } from './intent'
import { State, Reducer } from '..'
import { Token } from 'src/lang'
import { Stream } from 'xstream'
import randomWords from 'random-words'
import { ISelection } from 'monaco-editor'

export function updates(intents: Intents): Stream<Reducer> {
  return intents.range$.map(selection => (state: State) => {
    return {
      ...state,
      selection,
    }
  })
}
