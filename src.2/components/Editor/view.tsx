import { VNodeStyle } from 'snabbdom/modules/style'
import { VNode } from '@cycle/dom'
import { Stream } from 'xstream'
import { State, Portal } from './index'
import { init, last } from '../../../src/libs/array'

function getLines({
    buffer,
    instances
}: {
    buffer: String;
    instances: Portal[];
}) {
    return buffer
        .split('\n')
        .reduce(function (
            lines: Array<string | JSX.Element>,
            line,
            index
        ): Array<string | JSX.Element> {
            const prev = last(lines)
            const prevIsVisible = typeof prev === 'string'
            const lineIsHidden = instances.some(
                x => x.start <= index && x.end > index
            )

            if (index === 0) {
                lines.push(lineIsHidden ? hiddenLine(line) : line)
                return lines
            }

            if (!lineIsHidden) {
                if (prevIsVisible) {
                    return [...init(lines), [prev, line].join('\n')]
                }
                lines.push(line)
                return lines
            }

            if (prevIsVisible) {
                lines.push(hiddenLine(line))
                return lines
            }

            return [
                ...init(lines),
                {
                    ...(prev as JSX.Element),
                    children: [
                        ...((prev as JSX.Element).children || []),
                        <br />,
                        <div>line</div>
                    ]
                }
            ]
        },
            [])
}

export function view(state$: Stream<State>): Stream<VNode> {
    return state$.map(({ instances, buffer }) => {
        const lines = getLines({ buffer, instances })
        return (
            <div className="editor">
                <Buffer
                    style={{
                        '--height': String(buffer.split('\n').length)
                    }}
                >
                    {lines}
                </Buffer>
                {instances.map(portal => {
                    const res = (
                        <Buffer
                            data-portalId={portal.id}
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
                    )
                    console.log(res)
                    return res
                })}
            </div>
        )
    })
}

function hiddenLine(line: string) {
    return (
        <div
            className="_collapsed"
            style={{
                'max-height': 'var(--lh)',
                overflow: 'hidden',
                background: 'rgb(0, 100, 255)',
                color: 'transparent'
            }}
        >
            {line}
        </div>
    )
}

function Buffer(
    args: {
        className?: String;
        style?: VNodeStyle;
        start?: number;
        data?: Record<string, string | number | boolean>;
        props?: Object;
        attrs?: Record<string, string | number | boolean>;
    },
    children: JSX.Element[]
) {
    const { className, style, start = 0 } = args

    return (
        <pre
            {...args}
            style={style}
            className={[className, 'buffer'].filter(Boolean).join(' ')}
            attrs-contenteditable={true}
            attrs-spellcheck={false}
            scrolltop={fromLH(start)}
            hook={{
                insert: vnode => {
                    if (vnode.elm) {
                        (vnode.elm as HTMLElement).scrollTop = fromLH(start)
                    }
                }
            }}
        >
            {children}
        </pre>
    )
}

function fromLH(lh: number) {
    return lh * 25
}
