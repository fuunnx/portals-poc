import { VNodeStyle } from 'snabbdom/modules/style'

interface BufferElement {
    className?: String
    style?: VNodeStyle
    start?: number
    left?: number
    movable?: Boolean
}


export function Buffer(
    {
        className,
        style,
        movable,
        start = 0,
        left = 0,
    }: BufferElement,
    children: JSX.Element[]
) {
    return (
        <pre
            style={style}
            className={[className, 'buffer', movable && '-movable'].filter(Boolean).join(' ')}
            attrs-contenteditable={!movable}
            attrs-spellcheck={false}
            scrollTop={25 * start}
            scrollLeft={25 * left}
            hook={{
                insert: vnode => {
                    if (vnode.elm) {
                        let elm = vnode.elm as HTMLElement
                        elm.scrollTop = 25 * start
                        elm.scrollLeft = 12 * left
                    }
                }
            }}
        >
            {children}
        </pre>
    )
}