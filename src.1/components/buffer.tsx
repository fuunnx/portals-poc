import { VNodeStyle } from 'snabbdom/modules/style';

interface BufferElement {
    className?: String
    style?: VNodeStyle
    start?: number
    movable?: Boolean
}


export function Buffer(
    {
        className,
        style,
        movable,
        start = 0
    }: BufferElement,
    children: JSX.Element[]
) {
    return (
        <pre
            style={style}
            className={[className, 'buffer', movable && '-movable'].filter(Boolean).join(' ')}
            attrs-contenteditable={!movable}
            attrs-spellcheck={false}
            scrolltop={25 * start}
            hook={{
                insert: vnode => {
                    if (vnode.elm) {
                        (vnode.elm as HTMLElement).scrollTop = 25 * start;
                    }
                }
            }}
        >
            {children}
        </pre>
    );
}