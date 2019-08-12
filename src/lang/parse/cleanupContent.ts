import { last, map } from 'ramda'
import { Context, Portal, Dict, BufferContent } from '../types'

export function cleanupContent<T extends (Context | Portal | BufferContent)>(x: T): T {
    if (Array.isArray(x)) {
        return x.reduce((acc, curr) => {
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
        }, [])
    }

    if (x && 'portals' in x) {
        let portals = ((x as unknown) as { portals: unknown }).portals as Dict<Portal>
        x = {
            ...x,
            portals: map(cleanupContent, portals),
        }
    }

    if (x && x.hasOwnProperty('content')) {
        const content = (x as unknown as { content: BufferContent }).content
        x = {
            ...x,
            content: cleanupContent(content),
        }
    }

    return x
}
