import { VNodeStyle } from 'snabbdom/modules/style'
import { textarea } from '@cycle/dom';

interface BufferElement {
    key?: string | number
    className?: string
    style?: VNodeStyle
    start?: number
    left?: number
    end?: number
    movable?: Boolean,
    value?: string,
    width?: number,
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
        width = 0,
    }: BufferElement
) {
    console.log(left)
    return (

        <textarea
            key={key || `id-${start}-${end}`}
            style={Object.assign({
                '--height': String(end - start + 1),
                '--left': String(left || 0),
                '--width': String(width || 999)
            }, style)}
            className={[className, 'buffer', movable && '-movable'].filter(Boolean).join(' ')}
            attrs-contenteditable={!movable}
            attrs-spellcheck={false}
            scrollTop={25 * start}
            scrollLeft={12 * left}
            wrap='off'
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

                        console.log(elm.scrollLeft)
                    }
                }
            }}
            value={value}
        />
    )
}