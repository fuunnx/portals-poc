import xs, { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources, State } from './index'
import { init } from '../libs/array'
import { Dict, Token } from 'src/lang'

export function intent({ DOM, selection, state }: Sources) {
  const togglePreview$ = (DOM.select('[action="toggle-preview"]') as any)
    .events('click')
    .mapTo((st: State) => ({ ...st, disabled: !st.disabled }))

  const movable$ = xs
    .merge(
      (DOM.select('document') as any)
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Meta'),
      (DOM.select('document') as any)
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Meta')
        .mapTo(null),
    )
    .startWith(null)

  const currentRange$ = selection
    .selections()
    .map(selec => {
      if (selec.type !== 'Range') return undefined
      return selec.getRangeAt(0)
    })
    .filter(Boolean) as Stream<Range>

  const activeRange$ = currentRange$
    .take(1)
    .map(first => {
      return xs
        .combine(currentRange$, movable$)
        .fold((currentRange, [nexRange, movable]) => {
          if (movable) return currentRange
          else return nexRange
        }, first)
    })
    .flatten()

  const range$ = xs
    .combine(
      activeRange$,
      state.stream.map(x => x.buffer).compose(dropRepeats()),
    )
    .map(([range, buffer]): Array<[number, Token]> | undefined => {
      const start = init(buffer.slice(0, range.startOffset).split('\n')).length
      const end = buffer.slice(0, range.endOffset).split('\n').length

      return [
        [
          start - 1,
          {
            tag: 'portal',
            portal: 'selectionRange',
            pos: 'start',
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
        [
          start - 1,
          {
            tag: 'warp',
            portal: 'selectionRange',
            original: null,
          },
        ],
      ]
    })

  const mouseDown$ = xs
    .merge(
      (DOM.select('document') as any).events('mousedown'),
      (DOM.select('document') as any).events('mouseup').mapTo(null),
    )
    .startWith(null)

  const copiable$ = xs
    .merge(
      (DOM.select('document') as any)
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'Alt'),
      (DOM.select('document') as any)
        .events('keyup')
        .filter((e: KeyboardEvent) => e.key === 'Alt')
        .mapTo(null),
    )
    .startWith(null)

  let startMoving$ = movable$
    .map(movable => {
      if (!movable) return xs.empty()
      return (DOM.select('[data-buffer]') as any)
        .events('mousedown')
        .map((event: MouseEvent) => {
          const start = {
            x: event.clientX,
            y: event.clientY,
          }

          return move$().map(e => ({
            id: parseInt((event.target as HTMLElement).dataset.buffer || ''),
            x: e.clientX - start.x,
            y: e.clientY - start.y,
          }))
        })
        .flatten()
    })
    .flatten() as Stream<{ id: number; x: number; y: number }>

  return {
    input$: (DOM.select('document') as any).events('input') as Stream<
      InputEvent
    >,
    create$: xs.empty(),
    range$,
    movable$,
    copiable$,
    mouseDown$,
    togglePreview$,
    startMoving$,
    // movePortal$,
  }

  function move$() {
    return (DOM.select('document') as any)
      .events('mousemove')
      .endWhen(
        xs.merge(
          (DOM.select('document') as any).events('mouseup'),
          (DOM.select('window') as any).events('blur'),
        ),
      ) as Stream<MouseEvent>
  }
}
