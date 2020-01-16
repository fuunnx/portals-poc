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
      const editor = (getClosestParent(target, '[data-buffer]') as any)._editor

      if (editor) {
        return editor.getValue()
      }
      return ''
    })

  return {
    input$,
    commit$,
  }
}

function getClosestParent(
  element: (Node & HTMLElement) | EventTarget | null,
  selector: string,
): Node | null {
  let el = element as any
  while (!el?.matches?.(selector)) {
    if (!el) return null
    el = el.parentNode
  }
  return el
}
