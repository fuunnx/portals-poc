import { Sources } from './index'
import xs, { Stream } from 'xstream'
import { editor } from 'monaco-editor'

export type Intents = {
  input$: Stream<string>
  commit$: Stream<null>
}

export function intent(sources: Sources): Intents {
  const { DOM, time } = sources

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
    .compose(time.debounce(16))

  const input$ = (DOM.events as any)('monaco-changemodelcontent').map(
    (event: CustomEvent<editor.ITextModel>) => {
      let model = event.detail
      return model.getValue()
    },
  )

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
