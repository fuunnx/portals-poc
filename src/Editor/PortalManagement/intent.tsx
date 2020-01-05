import xs, { MemoryStream, Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from '../index'
import { equals } from 'ramda'
import { Id } from 'src/lang'

type HoveredLine = {
  id: Id
  line: number
  namespace: string[]
}

export type Intents = {
  dragging$: Stream<{ id: Id; x: number; y: number }>
}

export function intent(sources: Sources) {
  const { DOM } = sources

  const currentHoveredLine$ = DOM.select('[data-buffer]')
    .events('mousemove')
    .map((event: MouseEvent) => {
      const target = event.target as HTMLElement
      return {
        id: target.dataset.buffer || '',
        line:
          Math.round((event.y - target.getBoundingClientRect().top) / 25) +
          parseInt(target.dataset.lineOffset || '0'),
        namespace: (target as any).namespace as string[],
      }
    })
    .compose(dropRepeats(equals))
    .remember() as MemoryStream<HoveredLine>

  const dragging$ = DOM.select('[data-buffer]')
    .events('mousedown')
    .map((event: MouseEvent) => {
      const target = event.target as HTMLElement
      const id = target.dataset.buffer || ''
      const namespace = (target as any).namespace as string[]
      return move$()
        .filter(
          hovered =>
            hovered.id !== id &&
            !hovered.namespace.join(',').startsWith(namespace.join(',')),
        )
        .map(currentlyHovered => ({
          id,
          x: 0,
          y: currentlyHovered.line,
        }))
    })
    .flatten()

  return {
    dragging$,
  }

  function move$() {
    return currentHoveredLine$.endWhen(
      xs.merge(
        DOM.select('document').events('mouseup'),
        DOM.select('window').events('blur'),
      ),
    )
  }
}
