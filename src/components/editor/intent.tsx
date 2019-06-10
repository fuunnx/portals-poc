import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { Sources } from './index';

export function intent({ DOM, selection }: Sources) {

    const selection$ = selection.selections();
    const range$ = selection.selections().filter(x => x.type === 'Range');
    const caret$ = selection.selections().filter(x => x.type === 'Caret');

    const createPortal$ = DOM.select('document')
        .events('mousedown')
        .filter(e => e.altKey)
        .compose(sampleCombine(selection$))
        .map(([event, selection]) => ({ event, selection }))
        .filter(({ selection }) => selection.type === 'Range')
        .map(x =>
            move$()
                .take(1)
                .mapTo(x)
        )
        .flatten()

    const movePortal$ = createPortal$
        .map(({ event }) => {
            const start = {
                x: event.clientX,
                y: event.clientY
            };

            return move$().map(e => ({
                x: start.x - e.clientX,
                y: start.y - e.clientY
            }));
        })
        .flatten();


    return {
        input$: DOM.select('document')
            .events('input'),
        createPortal$,
        movePortal$,
    };

    function move$() {
        return DOM.select('document')
            .events('mousemove')
            .endWhen(
                xs.merge(
                    DOM.select('document').events('mouseup'),
                    DOM.select('window').events('blur')
                )
            );
    }
}