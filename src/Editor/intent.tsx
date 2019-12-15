import xs, { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources, State } from './index'
import { init } from '../libs/array'
import { Token } from 'src/lang'
import { calcPosition } from 'src/lang/parse/Line'

export function intent(sources: Sources) {
  const { DOM, selection, state, time } = sources
  const togglePreview$ = DOM.select('[action="toggle-preview"]')
    .events('click')
    .mapTo((st: State) => ({ ...st, disabled: !st.disabled }))

  const movable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Meta'),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(null),
    )
    .startWith(null)
    .compose(dropRepeats())

  const currentRange$ = selection.selections().map(selec => {
    if (!selec.rangeCount) return undefined
    const range = selec.getRangeAt(0)
    if (range.collapsed) return undefined

    const startContainer = range.startContainer.parentNode as HTMLElement
    const endContainer = range.endContainer.parentNode as HTMLElement

    // making a copy is necessary because the range can be mutated from outside
    return {
      startOffset:
        range.startOffset +
        parseInt(startContainer?.dataset?.startOffset || ''),
      endOffset:
        range.endOffset + parseInt(endContainer?.dataset?.startOffset || ''),
    }
  })

  const activeRange$ = xs
    .combine(currentRange$.compose(time.debounce(100)), movable$)
    .fold((currentRange: Range | undefined, [nexRange, movable]) => {
      if (movable) return currentRange
      else return nexRange
    }, undefined)

  const range$ = xs
    .combine(
      activeRange$,
      state.stream.map(x => x.buffer).compose(dropRepeats()),
    )
    .map(([range, buffer]: [Range, string]):
      | Array<[number, Token]>
      | undefined => {
      if (!range) return

      const start = buffer.slice(0, range.startOffset).split('\n').length - 1
      const end = buffer.slice(0, range.endOffset - 1).split('\n').length - 1

      return [
        [
          start,
          {
            tag: 'portal',
            portal: 'selectionRange',
            pos: 'start',
            original: null,
          },
        ],
        [
          start,
          {
            tag: 'warp',
            portal: 'selectionRange',
            original: null,
          },
        ],
        [
          end,
          {
            tag: 'portal',
            portal: 'selectionRange',
            pos: 'end',
            original: null,
          },
        ],
      ]
    })

  const currentHoveredLine$ = DOM.select('[data-buffer]')
    .events('mousemove')
    .map((event: MouseEvent) => {
      const target = event.target as HTMLElement
      console.log(target.dataset.lineOffset)
      return {
        id: parseInt(target.dataset.buffer || ''),
        line:
          Math.round((event.y - target.getBoundingClientRect().top) / 25) +
          parseInt(target.dataset.lineOffset || '0'),
      }
    })
    .remember()

  const mouseDown$ = xs
    .merge(
      DOM.select('document').events('mousedown'),
      DOM.select('document')
        .events('mouseup')
        .mapTo(null),
    )
    .startWith(null)

  const copiable$ = xs
    .merge(
      DOM.select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Alt'),
      DOM.select('document')
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(null),
    )
    .startWith(null)

  let startMoving$ = movable$
    .map(movable => {
      if (!movable) return xs.empty()
      return DOM.select('[data-buffer]')
        .events('mousedown')
        .map((event: MouseEvent) => {
          const start = {
            x: event.clientX,
            y: event.clientY,
          }

          const id = parseInt(
            (event.target as HTMLElement).dataset.buffer || '',
          )
          console.log(id)

          return move$()
            .filter(x => x.id !== id)
            .map(currentlyHovered => ({
              id,
              // x: e.clientX - start.x,
              x: 0,
              y: currentlyHovered.line,
            }))
        })
        .flatten()
    })
    .flatten() as Stream<{ id: number; x: number; y: number }>

  const commit$ = mouseDown$.drop(1).filter(x => x === null)

  const edit$ = DOM.select('[data-buffer]')
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
    input$: edit$,
    create$: xs.empty(),
    range$,
    movable$,
    copiable$,
    mouseDown$,
    togglePreview$,
    startMoving$,
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
