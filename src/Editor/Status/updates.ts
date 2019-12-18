import { Intents } from './intent'
import xs from 'xstream'
import { State } from '..'

export function updates(intents: Intents) {
  const togglePreview$ = intents.togglePreview$.mapTo((st: State) => ({
    ...st,
    disabled: !st.disabled,
  }))
  const movable$ = intents.movable$.map(movable => (curr: State) => ({
    ...curr,
    movable: Boolean(movable),
  }))

  const copiable$ = intents.copiable$.map(copiable => (curr: State) => ({
    ...curr,
    copiable: Boolean(copiable),
  }))

  return xs.merge(togglePreview$, movable$, copiable$)
}
