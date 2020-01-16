import xs, { Stream } from 'xstream'
import { Sources } from '../index'
import { editor, Selection } from 'monaco-editor'

export type Intents = {
  range$: Stream<Selection>
}

export function intent(sources: Sources) {
  const { DOM } = sources

  const range$ = (DOM.events as any)('monaco-selectionchange').map(
    (event: CustomEvent<editor.ICursorSelectionChangedEvent>) => {
      let selectionChange = event.detail
      return selectionChange.selection
    },
  )

  return {
    range$,
  }
}
