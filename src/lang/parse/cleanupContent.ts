import { map, last } from 'ramda'
import { Context, Portal, Dict, Content, BufferContent } from '../types'
import { values } from '@collectable/sorted-map'
import { unwrap } from '@collectable/core'

export interface CleanPortal extends Omit<Portal, 'content'> {
    content: Array<BufferContent>
}

export interface CleanContext extends Omit<Omit<Context, 'content'>, 'portals'> {
    content: Array<BufferContent>
    portals: Dict<CleanPortal>
}

export function cleanupContent(x: Context): CleanContext {
    return {
        ...x,
        portals: map((portal) => {
            return {
                ...portal,
                content: cleanup(portal.content)
            }
        }, x.portals),
        content: cleanup(x.content),
    }

    function cleanup(content: Content): Array<BufferContent> {

        return Array.from(values(content)).reduce((acc, curr) => {
            const prev = last(acc)
            if (!prev || prev.type !== 'text' || curr.type !== 'text') {
                acc.push(curr)
                return acc
            }

            prev.start = Math.min(prev.start, curr.start)
            prev.end = Math.max(prev.end, curr.end)
            prev.left = Math.min(prev.left, curr.left)
            prev.right = Math.max(prev.right, curr.right)
            return acc
        }, [] as Array<BufferContent>)
    }
}
