import { Buffer } from '../buffer'
import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import { parse, BufferContent, PortalsDict } from '../../parser'

export function view(state$: Stream<State>): Stream<VNode> {
    return state$
        .map(state => {
            return { buffer: state.buffer, ...parse(state.buffer) }
        })
        .map(editor)
}

function editor({ content, portals, buffer }: { content: Array<BufferContent>, portals: PortalsDict, buffer: string }) {

    return (
        <div className="editor">
            {(content.map((x, i) => {
                const key = i
                if (x.type === 'text') {
                    return text(buffer, x, key)
                }
                if (x.type === 'opening' || x.type === 'ending') {
                    return text(buffer, x, key)
                }
                if (x.type === 'destination') {
                    const matchingPortal = portals[x.for]
                    return (
                        <div className="portal-instance">
                            {text(buffer, x, key)}
                            {matchingPortal && editor({ content: matchingPortal.content, portals, buffer })}
                        </div>
                    )
                }
                return null
            }))}
        </div>
    )
}

function text(buffer: string, x: { start: number, end: number, type?: string }, key?: (string | number)) {
    return <Buffer value={buffer} key={key} className={x.type || ''} start={x.start} end={x.end} />
}