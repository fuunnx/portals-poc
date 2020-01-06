import xs, { MemoryStream, Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from '../index'
import { equals } from 'ramda'
import { Id } from 'src/lang'

type HoveredLine = {
  id: Id
  lineIndex: number
  columnIndex: number
  namespace: string[]
}

export type Intents = {
  dragging$: Stream<{ id: Id; columnIndex: number; lineIndex: number }>
  selectedElement$: Stream<Id | undefined>
}

export function intent(sources: Sources) {
  const { DOM } = sources

  const currentHoveredLine$ = DOM.select('[data-buffer]')
    .events('mousemove')
    .map(event => {
      const target = event.target as HTMLElement
      return {
        id: target.dataset.buffer || '',
        lineIndex:
          Math.round((event.y - target.getBoundingClientRect().top) / 25) +
          (parseFloat(target.dataset.lineOffset || '') || 0) -
          0.5,
        columnIndex: parseFloat(target.dataset.columnIndex || '') || 0,
        namespace: (target as any).namespace as string[],
      }
    })
    .compose(dropRepeats(equals))
    .remember() as MemoryStream<HoveredLine>

  const currentHoveredColumn$ = DOM.select('[data-dropzone]')
    .events('mouseover')
    .map(event => {
      const target = event.target as HTMLElement
      return {
        lineIndex: parseFloat(target.dataset.lineIndex || '') || 0,
        columnIndex: parseFloat(target.dataset.columnIndex || '') || 0,
      }
    })

  const dragStart$ = DOM.select('[data-buffer]')
    .events('mousedown')
    .map((event: MouseEvent) => {
      const target = event.target as HTMLElement
      const id = target.dataset.buffer || ''
      const namespace = (target as any).namespace as string[]

      return { id, namespace }
    })

  const dragging$ = dragStart$
    .map(({ id, namespace }) => {
      return xs
        .merge(
          currentHoveredLine$.filter(
            hovered =>
              hovered.id !== id &&
              !hovered.namespace.join(',').startsWith(namespace.join(',')),
          ),
          currentHoveredColumn$,
        )
        .endWhen(dragEnd$)
        .map(currentlyHovered => ({
          id,
          columnIndex: currentlyHovered.columnIndex,
          lineIndex: currentlyHovered.lineIndex,
        }))
    })
    .flatten()
    .debug('dragging')

  const dragEnd$ = xs.merge(
    DOM.select('document').events('mouseup'),
    DOM.select('window').events('blur'),
  )

  const selectedElement$ = xs.merge(
    dragStart$.map(x => x.id),
    dragEnd$.mapTo(undefined),
  )

  return {
    dragging$,
    selectedElement$,
  }
}
