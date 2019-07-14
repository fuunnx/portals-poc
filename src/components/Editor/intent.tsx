import xs from 'xstream'
// import sampleCombine from 'xstream/extra/sampleCombine'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from './index'
import { init } from '../../libs/array'
import { PortalInstance } from 'src/parser';

export function intent({ DOM, selection, state }: Sources) {

    const selection$ = selection.selections()
    const range$ = xs.combine(
        selection$,
        state.stream.map(x => x.buffer).compose(dropRepeats())
    )
        .map(([selec, buffer]): (PortalInstance | null) => {
            if (selec.type !== 'Range') return null

            const range = selec.getRangeAt(0)
            const allLines = buffer.split('\n')

            const start = init(buffer.slice(0, range.startOffset).split('\n'))
                .length
            const height = buffer
                .slice(range.startOffset, range.endOffset)
                .split('\n').length
            const end = start + height
            const selected = allLines.slice(start, end)

            const left = selected
                .map(x => (x.match(/^\s+/) || [''])[0].length)
                .reduce((a, b) => Math.min(a, b), Infinity)

            const width = selected
                .map(x => x.length)
                .reduce((a, b) => Math.max(a, b), left)

            return {
                start,
                end: start + height,
                height,
                width: width - left,
                top: start,
                left: left,
                content: []
            }
        })

    const mouseDown$ = xs.merge(
        DOM.select('document')
            .events('mousedown'),
        DOM.select('document')
            .events('mouseup')
            .mapTo(null),
    ).startWith(null)

    const copiable$ = xs.merge(
        DOM.select('document')
            .events('keydown')
            .filter(e => e.key === 'Alt'),
        DOM.select('document')
            .events('keyup')
            .filter(e => e.key === 'Alt')
            .mapTo(null),
    ).startWith(null)

    const movable$ = xs.merge(
        DOM.select('document')
            .events('keydown')
            .filter(e => e.key === 'Meta'),
        DOM.select('document')
            .events('keyup')
            .filter(e => e.key === 'Meta')
            .mapTo(null)
    ).startWith(null)

    // const create$ = movable$.filter(Boolean)
    //     .compose(sampleCombine(selection$))
    //     .map(([, selection]) => selection)
    //     .filter((selection) => selection.type === 'Range')

    // move$()
    //     .map(({ event }) => {
    //         const start = {
    //             x: event.clientX,
    //             y: event.clientY
    //         }

    //         return move$().map(e => ({
    //             x: start.x - e.clientX,
    //             y: start.y - e.clientY
    //         }))
    //     })
    //     .flatten()


    return {
        input$: DOM
            .select('document')
            .events('input'),
        create$: xs.empty(),
        range$,
        movable$,
        copiable$,
        mouseDown$,
        // movePortal$,
    }

    // function move$() {
    //     return DOM.select('document')
    //         .events('mousemove')
    //         .endWhen(
    //             xs.merge(
    //                 DOM.select('document').events('mouseup'),
    //                 DOM.select('window').events('blur')
    //             )
    //         )
    // }
}