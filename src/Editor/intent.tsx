import { Sources } from './index'
import xs, { Stream } from 'xstream'

export type Intents = {
  input$: Stream<string>
  commit$: Stream<null>
}

export function intent(sources: Sources): Intents {
  const { DOM } = sources

  const mouseDown$ = xs
    .merge(
      DOM.select('document')
        .events('mousedown')
        .mapTo(true),
      DOM.select('document')
        .events('mouseup')
        .mapTo(false),
    )
    .startWith(false)

  const commit$ = mouseDown$
    .filter(x => x === false)
    .drop(1)
    .mapTo(null)

  const input$ = DOM.select('[data-buffer]')
    .events('input')
    .map(event => {
      const target = event.target as HTMLElement
      const startOffset = parseInt(target.dataset.startOffset || '')
      const endOffset = parseInt(target.dataset.endOffset || '')
      const value = target.dataset.value || ''
      const newValue = target.innerText

      return (
        value.slice(0, startOffset + 1) + newValue + value.slice(endOffset + 1)
      )
    })

  return {
    input$,
    commit$,
  }
}
