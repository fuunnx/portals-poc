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
  const { DOM, time } = sources

  const bufferSelector = '[data-buffer]'
  const currentHoveredLine$ = DOM.select('[data-line-index]')
    .events('mousemove')
    .map(event => {
      const parentBuffer = getClosestParent(
        event.target,
        bufferSelector,
      ) as HTMLElement

      const target = event.target as HTMLElement
      return {
        id: parentBuffer?.dataset.buffer || '',
        lineIndex: (parseFloat(target.dataset.lineIndex || '0') || 0) - 0.5,
        columnIndex: parseFloat(target.dataset.columnIndex || '0') || 0,
        namespace: ((parentBuffer as any)?.namespace || []) as string[],
      }
    })
    .compose(dropRepeats(equals))
    .remember() as MemoryStream<HoveredLine>

  const dropZoneSelector = '[data-dropzone]'
  const currentHoveredColumn$ = DOM.select(dropZoneSelector)
    .events('mouseover')
    .map(event => {
      const target = getClosestParent(
        event.target,
        dropZoneSelector,
      ) as HTMLElement

      return {
        lineIndex: parseFloat(target.dataset.lineIndex || '') || 0,
        columnIndex: parseFloat(target.dataset.columnIndex || '') || 0,
      }
    })

  let draggableSelector = '[data-buffer][data-draggable=true]'
  const dragStart$ = DOM.select(draggableSelector)
    .events('mousedown')
    .map((event: MouseEvent) => {
      const target = getClosestParent(
        event.target,
        draggableSelector,
      ) as HTMLElement
      const id = target?.dataset.buffer || ''
      const namespace = ((target as any).namespace || []) as string[]

      return { id, namespace }
    })

  const dragging$ = dragStart$
    .map(({ id, namespace }) => {
      return xs
        .merge(
          currentHoveredLine$.filter(
            hovered =>
              hovered.id !== id &&
              (!namespace.length ||
                !hovered.namespace.join(',').startsWith(namespace.join(','))),
          ),
          // so it takes precedence over hoveredLine events
          currentHoveredColumn$.compose(time.delay(0)),
        )
        .endWhen(dragEnd$)
        .map(currentlyHovered => ({
          id,
          columnIndex: currentlyHovered.columnIndex,
          lineIndex: currentlyHovered.lineIndex,
        }))
    })
    .flatten()

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
