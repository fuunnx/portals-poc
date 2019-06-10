import { Buffer } from '../buffer';
import { State } from './index'
import { Stream } from 'xstream';
import { VNode } from '@cycle/dom';

export function view(state$: Stream<State>): Stream<VNode> {
    return state$.map(({ instances, buffer }) => (
        <div className="editor">
            <Buffer style={{ '--height': String(buffer.split('\n').length) }}>
                {buffer}
            </Buffer>
            {instances.map(portal => (
                <Buffer
                    className="portal"
                    start={portal.start}
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
    ));
}
