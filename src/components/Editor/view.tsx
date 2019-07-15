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
                const matchingPortal = portals[x.for]
                const width = Math.max(x.width, matchingPortal.width)

                if (x.type === 'opening' || x.type === 'ending') {
                    return text(buffer, x, key, width)
                }

                if (x.type === 'destination') {
                    return (
                        <div className="portal-instance" style={{ 'max-width': `calc(var(--ch) * ${width + 20})` }}>
                            {text(buffer, x, key, width)}
                            {matchingPortal && editor({ content: matchingPortal.content, portals, buffer })}
                        </div>
                    )
                }
                return null
            }))}
        </div>
    )
}

function text(buffer: string, x: { start: number, end: number, type?: string }, key?: (string | number), width?: number) {
    return <Buffer value={buffer} key={key} className={x.type || ''} start={x.start} end={x.end} width={width} />
}