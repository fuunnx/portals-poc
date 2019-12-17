import xs, { Stream, MemoryStream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from './index'
import { equals } from 'ramda'

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
  const { DOM, selection, state, time } = sources
  const togglePreview$ = DOM.select('[action="toggle-preview"]')
    .events('click')
    .mapTo(null)

  const movable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(true),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(false),
    )
    .startWith(false)
    .compose(dropRepeats())

  const currentRange$ = selection
    .selections()
    .map(selec => {
      if (!selec.rangeCount) return undefined
      const range = selec.getRangeAt(0)
      if (range.collapsed) return undefined

      // there are cross browser issues that need to be solved (firefox for eg)
      const startContainer = range.startContainer.parentNode as HTMLElement
      const endContainer = range.endContainer.parentNode as HTMLElement
      // making a copy is necessary because the range can be mutated from outside
      return {
        startOffset:
          range.startOffset +
          parseInt(startContainer.dataset.startOffset || ''),
        endOffset:
          range.endOffset + parseInt(endContainer.dataset.startOffset || ''),
      }
    })
    .compose(dropRepeats(equals))

  const activeRange$ = xs
    .combine(currentRange$, movable$)
    .fold((currentRange: Range | undefined, [nexRange, movable]) => {
      if (movable) return currentRange
      else return nexRange
    }, undefined)
    .debug('acrive range')

  const range$ = xs
    .combine(
      activeRange$,
      state.stream.map(x => x.buffer).compose(dropRepeats()),
    )
    .map(([range, buffer]: [Range, string]):
      | { start: number; end: number }
      | undefined => {
      if (!range) return

      const start = buffer.slice(0, range.startOffset).split('\n').length - 1
      const end = buffer.slice(0, range.endOffset - 1).split('\n').length - 1
      console.log(buffer.slice(0, range.startOffset).split('\n'))
      return { start, end }
    })
    .debug('range')
    .filter(Boolean) as Stream<{ start: number; end: number }>

  const currentHoveredLine$ = DOM.select('[data-buffer]')
    .events('mousemove')
    .map((event: MouseEvent) => {
      const target = event.target as HTMLElement
      return {
        id: parseInt(target.dataset.buffer || ''),
        line:
          Math.round((event.y - target.getBoundingClientRect().top) / 25) +
          parseInt(target.dataset.lineOffset || '0'),
        namespace: (target as any).namespace as string[],
      }
    })
    .compose(dropRepeats(equals))
    .remember() as MemoryStream<{
    id: number
    line: number
    namespace: string[]
  }>

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

  const copiable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(true),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(false),
    )
    .startWith(false)

  let startMoving$ = DOM.select('[data-buffer]')
    .events('mousedown')
    .map((event: MouseEvent) => {
      const start = {
        x: event.clientX,
        y: event.clientY,
      }
      const target = event.target as HTMLElement
      const id = parseInt(target.dataset.buffer || '')

      const namespace = (target as any).namespace as string[]
      return move$()
        .filter(
          hovered =>
            hovered.id !== id &&
            !hovered.namespace.join(',').startsWith(namespace.join(',')),
        )
        .map(currentlyHovered => ({
          id,
          // x: e.clientX - start.x,
          x: 0,
          y: currentlyHovered.line,
        }))
    })
    .flatten()

  const commit$ = mouseDown$
    .drop(1)
    .filter(x => x === null)
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
    range$,
    movable$,
    copiable$,
    togglePreview$,
    startMoving$,
    input$,
    commit$,
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
