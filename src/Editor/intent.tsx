import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Sources } from './index'
import { init } from '../libs/array'
import { Dict, Token } from 'src/lang'

export function intent({ DOM, selection, state }: Sources) {
    const selection$ = selection.selections()
    const range$ = xs.combine(
        selection$,
        state.stream.map(x => x.buffer).compose(dropRepeats())
    )
        .map(([selec, buffer]): (Array<[number, Token]> | undefined) => {
            if (selec.type !== 'Range') return undefined
            const range = selec.getRangeAt(0)
            const start = init(buffer.slice(0, range.startOffset).split('\n'))
                .length - 1
            const end = buffer
                .slice(0, range.endOffset)
                .split('\n').length

            return [
                [
                    start,
                    {
                        tag: 'warp',
                        portal: 'selectionRange',
                        original: null,
                    },
                ],
                [
                    start, {
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
                    }
                ]
            ]
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
