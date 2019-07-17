import { is, last, isNil, filter, map, join } from 'ramda'

interface Dict<T> {
  [id: string]: T
}

export type BufferContent = Placeholder | Destination | Text | Opening | Ending
export type PortalsDict = Dict<Portal>

interface Context {
  content: Array<BufferContent>
  portals: Dict<Portal>
}

type LineCount = number
type CharCount = number
type Id = string

export interface Portal {
  id?: Id
  start: LineCount
  end: LineCount
  left: CharCount
  right: CharCount
  content: Array<BufferContent>
  warped?: boolean
}

export interface PortalInstance extends Portal {
  top: LineCount
  left: CharCount
  right: CharCount
  height: LineCount
}

interface Token {
  tag: string
  id: Id
  pos?: 'start' | 'end'
  original: string
}

export interface Opening extends Ref {
  type: 'opening'
}

export interface Ending extends Ref {
  type: 'ending'
}

export interface Placeholder extends Ref {
  type: 'placeholder'
}

export interface Destination extends Ref {
  type: 'destination'
}

export interface Text extends Base {
  type: 'text'
}

interface Ref extends Base {
  for: Id
}

interface Base {
  start: LineCount
  end: LineCount
  left: CharCount
  right: CharCount
}

export function parse(text: string): Context {
  const lines = text.split('\n').map(line => {
    return tokenize(line) || line
  })

  const portals = filter(
    isComplete,
    lines.reduce(
      (dict, line, index) => {
        if (is(String, line)) {
          return dict
        }
        if (line.tag === 'warp') {
          dict[line.id] = {
            ...dict[line.id],
            id: line.id,
            warped: true,
          }
        }

        if (line.tag !== 'portal') {
          return dict
        }

        if (line.pos === 'start') {
          dict[line.id] = {
            ...dict[line.id],
            id: line.id,
            start: index + 1,
            left: 0,
            right: 0,
            content: [],
          }
        }

        if (line.pos === 'end') {
          if (dict[line.id]) {
            dict[line.id] = {
              ...dict[line.id],
              end: index - 1,
            }
          }
        }

        return dict
      },
      {} as Dict<Partial<Portal>>,
    ),
  ) as Dict<Portal>

  const ctx = lines.reduce(
    (context, line, index) => {
      if (is(String, line)) {
        return pushToContext(
          {
            type: 'text',
            ...position(line),
          },
          context,
          index,
        )
      }

      if (!portals[line.id]) {
        return pushToContext(
          {
            type: 'text',
            ...position(line.original),
          },
          context,
          index,
        )
      }

      if (line.tag === 'warp') {
        return pushToContext(
          {
            type: 'destination',
            for: line.id,
            ...position(line.original),
          },
          context,
          index,
        )
      }
      if (line.tag === 'portal') {
        if (line.pos === 'start') {
          return pushToContext(
            {
              type: 'opening',
              for: line.id,
              ...position(line.original),
            },
            context,
            index,
          )
        }
        if (line.pos === 'end') {
          return pushToContext(
            {
              type: 'ending',
              for: line.id,
              ...position(line.original),
            },
            context,
            index,
          )
        }
      }
      return context

      function position(str: string): Base {
        const left = ((str.match(/^[\s]+/g) || [])[0] || '').length
        return {
          start: index,
          end: index,
          left: left,
          right: str.length,
        }
      }
    },
    { content: [], portals } as Context,
  )

  const ctx2 = joinStrings(ctx)
  const portals2 = map(portal => {
    const right = (portal.content || []).reduce((max, curr) => {
      return Math.max(max, curr.right)
    }, 0)
    const left = (portal.content || []).reduce((min, curr) => {
      return Math.min(min, curr.left)
    }, Infinity)

    return {
      ...portal,
      right,
      left,
    }
  }, portals) as Dict<Portal>

  return {
    ...ctx2,
    portals: portals2,
  }
}

function pushToContext(
  toPush: BufferContent,
  context: Context,
  index: number,
): Context {
  let openedPortals = Object.values(context.portals).filter(portal => {
    return portal.start <= index && index <= portal.end
  })

  if (!openedPortals.length) {
    context.content.push(toPush)
    return context
  }

  openedPortals.forEach(portal => {
    const smallerPortalsInside = openedPortals.some(x => {
      return (
        x.id !== portal.id && portal.start <= x.start && x.start <= portal.end
      )
    })
    if (!smallerPortalsInside) {
      portal.content.push(toPush)
    }
  })
  return context
}

function joinStrings<T>(x: T): T {
  if (Array.isArray(x)) {
    return x.reduce((acc, curr) => {
      const prev = last(acc)
      if (!prev || prev.type !== 'text' || curr.type !== 'text') {
        acc.push(curr)
        return acc
      }

      prev.end = curr.end
      prev.right = Math.max(prev.right, curr.right)
      prev.left = Math.min(prev.left, curr.left)
      return acc
    }, [])
  }

  if (x && 'portals' in x) {
    let portals = ((x as unknown) as { portals: unknown }).portals as Dict<T>
    x = {
      ...x,
      portals: map(joinStrings, portals),
    }
  }
  if (x && 'content' in x) {
    x = {
      ...x,
      content: joinStrings(
        ((x as unknown) as { content: Array<unknown> }).content,
      ),
    }
  }

  return x
}

function isComplete(x: any) {
  return x && x.warped && x.content && !isNil(x.start) && !isNil(x.end)
}

function isComment(str: string) {
  return str.trim().startsWith('//')
}

function tokenize(str: string) {
  if (!isComment(str)) return null

  let tokens = str.split(' ')

  let returned: Token = {
    tag: '',
    id: '',
    pos: undefined,
    original: str,
  }

  tokens.forEach(token => {
    if (token === 'WARP') {
      returned.tag = 'warp'
    }
    if (token === 'PORTAL') {
      returned.tag = 'portal'
      returned.pos = 'start'
    }
    if (token === '/PORTAL') {
      returned.tag = 'portal'
      returned.pos = 'end'
    }
    if (returned.tag && token.startsWith('#')) {
      returned.id = token.replace(/^#/, '')
    }
  })

  if (!returned.tag) {
    return null
  }

  return returned
}