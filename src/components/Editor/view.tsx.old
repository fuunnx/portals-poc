import { Buffer } from '../buffer'
import { State } from './index'
import { Stream } from 'xstream'
import { VNode } from '@cycle/dom'
import { parse } from '../../parser'

export function view(state$: Stream<State>): Stream<VNode> {
    return state$
        .map(state => {
            // const instances = (parse(state.buffer).portals)
            return { ...state }
        })
        .map(({ instances, buffer, movable, range, copiable }) => {

            console.log(range)
            return (
                <div className="editor">
                    <Buffer movable={movable} style={{ '--height': String(buffer.split('\n').length) }}>
                        {buffer}
                    </Buffer>
                    {movable && range && <Buffer
                        className="portal"
                        movable={movable}
                        start={range.start}
                        left={range.left}
                        style={{
                            '--start': String(range.start),
                            '--end': String(range.end),
                            '--height': String(range.height),
                            '--width': String(range.width),
                            '--top': String(range.top),
                            '--left': String(range.left)
                        }}
                    >
                        {buffer}
                    </Buffer>}
                    {instances.map(portal => (
                        <Buffer
                            className="portal"
                            movable={movable}
                            start={portal.start}
                            left={portal.left}
                            style={{
                                '--start': String(portal.start),
                                '--end': String(portal.end),
                                '--height': String(portal.height),
                                '--width': String(portal.width),
                                '--top': String(portal.top),
                                '--left': String(portal.left)
                            }}
                        >
                            {buffer}
                        </Buffer>
                    ))}
                </div>
            )

        })
}
