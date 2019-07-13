import xs, { Stream } from 'xstream'
import { init } from '../../../src/libs/array'
import { Portal, Sources } from './index'
import sampleCombine from 'xstream/extra/sampleCombine'

export interface Intents {
    dragMode$: Stream<boolean>
    input$: Stream<string>
    createPortal$: Stream<Portal>
    movePortal$: Stream<{ id: string; left: number; top: number }>
}

export function intent({ selection, DOM, state }: Sources): Intents {
    const selection$ = selection.selections()
    // const range$ = selection.selections().filter(x => x.type === 'Range');
    // const caret$ = selection.selections().filter(x => x.type === 'Caret');

    function startDragging(target: string) {
        return DOM.select(target)
            .events('mousedown')
            .filter(e => e.altKey)
            .map(x =>
                move()
                    .take(1)
                    .mapTo(x)
            )
            .flatten()
    }

    const createPortal$ = startDragging('document')
        .compose(sampleCombine(selection$, state.stream))
        .filter(([, selec]) => selec.type === 'Range')
        .map(([event, selec, { buffer }]) => {
            const range = selec.getRangeAt(0)
            const allLines = buffer.split('\n')
            const start = init(buffer.slice(0, range.startOffset).split('\n'))
                .length
            const height = buffer
                .slice(range.startOffset, range.endOffset)
                .trim()
                .split('\n').length
            const end = start + height
            const selected = allLines.slice(start, end)

            const left = selected
                .map(x => (x.match(/^\s+/) || [''])[0].length)
                .reduce((a, b) => Math.min(a, b), Infinity)

            const width = selected
                .map(x => x.length)
                .reduce((a, b) => Math.max(a, b), 1)

            return {
                event,
                portal: {
                    id: Math.random()
                        .toString(16)
                        .split('.')[1],
                    start,
                    end: start + height,
                    height,
                    width: width === left ? width : width - left,
                    top: start,
                    left: width === left ? left : 0
                }
            }
        })

    const dragStart$ = startDragging('[data-portal-id]')
        .debug('starting')
        .compose(sampleCombine(selection$, state.stream.map(x => x.instances)))
        .filter(([, selec]) => selec.type !== 'Range')
        .map(([event, , instances]) => ({
            event,
            portal: instances.find(
                portal =>
                    portal.id === (event.target as HTMLElement).dataset.portalId
            )
        }))
        .filter(x => Boolean(x.portal))

    const movePortal$ = xs
        .merge(createPortal$, dragStart$)
        .map(({ event, portal: portal_ }) => {
            const portal = portal_ as Portal // wtf can't be undefined here
            const start = { x: event.clientX, y: event.clientY }
            event.target && (event.target as HTMLElement).blur()

            return move().map(e => ({
                id: portal.id,
                left: portal.left + toCH(e.clientX - start.x),
                top: portal.top + toLH(e.clientY - start.y)
            }))
        })
        .flatten()
        .debug('movePortal')

    function move() {
        return DOM.select('document')
            .events('mousemove')
            .endWhen(
                xs.merge(
                    DOM.select('document').events('mouseup'),
                    DOM.select('window').events('blur')
                )
            )
    }

    const input$ = DOM.select('document')
        .events('input')
        .map(ev => (ev.target as HTMLElement).textContent || '')

    const dragMode$ = xs.merge(
        DOM.select('document')
            .events('keydown')
            .filter(x => x.altKey)
            .mapTo(true),
        DOM.select('document')
            .events('keyup')
            .filter(x => x.altKey)
            .mapTo(false)
    )

    return {
        dragMode$,
        input$,
        createPortal$: createPortal$.map(x => x.portal),
        movePortal$
    }
}

function toLH(px: number) {
    return Math.round(px / 25)
}

function toCH(px: number) {
    return Math.round(px / 12)
}
