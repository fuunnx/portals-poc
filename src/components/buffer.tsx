import { VNodeStyle } from 'snabbdom/modules/style';

export function Buffer(
    {
        className,
        style,
        start = 0
    }: { className?: String; style?: VNodeStyle; start?: number },
    children: JSX.Element[]
) {
    console.log(25 * start);
    return (
        <pre
            style={style}
            className={[className, 'buffer'].filter(Boolean).join(' ')}
            attrs-contenteditable={true}
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