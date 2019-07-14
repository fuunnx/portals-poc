import { VNodeStyle } from 'snabbdom/modules/style'

interface BufferElement {
    key?: string | number
    className?: string
    style?: VNodeStyle
    start?: number
    left?: number
    end?: number
    movable?: Boolean,
    value?: string,
}


export function Buffer(
    {
        key,
        className,
        style = {},
        movable,
        start = 0,
        left = 0,
        end = 0,
        value = '',
    }: BufferElement
) {

    return (

        <textarea
            key={key || `id-${start}-${end}`}
            style={Object.assign({ '--height': String(end - start + 1) }, style)}
            className={[className, 'buffer', movable && '-movable'].filter(Boolean).join(' ')}
            attrs-contenteditable={!movable}
            attrs-spellcheck={false}
            scrollTop={25 * start}
            scrollLeft={12 * left}
            hook={{
                update: vnode => {
                    if (vnode.elm) {
                        let elm = vnode.elm as HTMLElement
                        elm.scrollTop = 25 * start
                        elm.scrollLeft = 12 * left

                        elm.onscroll = () => {
                            elm.scrollTop = 25 * start
                            elm.scrollLeft = 12 * left
                        }
                    }
                }
            }}
            value={value}
        />
    )
}