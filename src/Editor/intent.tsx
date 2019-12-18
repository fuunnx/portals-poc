import { Sources } from './index'
import { getPortalMoves } from './getPortalMoves'
import xs, { Stream, MemoryStream } from 'xstream'
import { getDocumentStatus } from './getDocumentStatus'
import { getSelectionRange } from './getSelectionRange'

export type Intents = {
  input$: Stream<string>
  range$: Stream<{ start: number; end: number }>
  movable$: MemoryStream<boolean>
  copiable$: MemoryStream<boolean>
  startMoving$: Stream<{ id: number; x: number; y: number }>
  togglePreview$: Stream<null>
  commit$: Stream<null>
}

export function intent(sources: Sources): Intents {
  const { DOM } = sources

  const status = getDocumentStatus(sources)
  const startMoving$ = getPortalMoves(sources)

  const togglePreview$ = DOM.select('[action="toggle-preview"]')
    .events('click')
    .mapTo(null)

  const commit$ = status.mouseDown$
    .drop(1)
    .filter(x => x === false)
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

  const range$ = xs
    .combine(getSelectionRange(sources), status.movable$)
    .fold((currentRange: Range | undefined, [nexRange, movable]) => {
      if (movable) return currentRange
      else return nexRange
    }, undefined)
    .filter(Boolean) as Stream<{ start: number; end: number }>

  return {
    ...status,
    togglePreview$,
    range$,
    startMoving$,
    input$,
    commit$,
  }
}
