import 'jest'

import { parse } from './index'
import { cleanupContext, to2dArray } from './cleanupContent'
import { Token, Context, Symbol, Content } from '../types'
import { map } from 'ramda'
import { comment, portalStart, portalEnd, warp } from '../helpers'
import { verbs } from 'src/config'

function cleanup(context: Context): any {
  return cleanupContext(context, symbol => {
    delete symbol.id
    delete symbol.boundingRect
    delete symbol.position
    return symbol
  })
}

test('empty text', () => {
  expect(cleanup(parse(''))).toEqual({
    portals: {},
    content: [[{ type: 'text' }]],
  })
})

test('no annotations', () => {
  expect(
    cleanup(
      parse(`
Hello guys

How are you ?
`),
    ),
  ).toEqual({
    portals: {},
    content: [[{ type: 'text' }]],
  })
})

test('simple', () => {
  expect(
    cleanup(
      parse(`
${comment(portalStart(1))}
Hello guys
${comment(portalEnd(1))}

How are you ?
`),
    ),
  ).toEqual({
    content: [[{ type: 'text' }]],
    portals: {},
  })
})

test('with target', () => {
  expect(
    cleanup(
      parse(`
${comment(portalStart(1))}
Hello guys
Tadaa
Multiline
${comment(portalEnd(1))}

How are you ?
${comment(warp(1))}
Hum
`),
    ),
  ).toEqual({
    content: [
      [{ type: 'text' }],
      [{ type: 'opening', for: '1' }],
      [{ type: 'ending', for: '1' }],
      [{ type: 'text' }],
      [{ type: 'destination', for: '1' }],
      [{ type: 'text' }],
    ],
    portals: {
      '1': {
        id: '1',
        content: [[{ type: 'text' }]],
        warped: true,
        boundingRect: {
          columnEnd: 5,
          columnStart: 0,
          lineEnd: 5,
          lineStart: 1,
        },
      },
    },
  })
})

test('malformed', () => {
  expect(
    cleanup(
      parse(`
${comment(portalStart(1))}
Hello guys

How are you ?
${comment(warp(1))}
`),
    ),
  ).toEqual({
    content: [[{ type: 'text' }]],
    portals: {},
  })
})

test('nested', () => {
  expect(
    cleanup(
      parse(`
${comment(portalStart(1))}
Hello
${comment(portalStart(2))}
guys
${comment(portalEnd(2))}
${comment(portalEnd(1))}

How are you ?
${comment(warp(1))}
${comment(warp(2))}
`),
    ),
  ).toEqual({
    content: [
      [{ type: 'text' }],
      [{ type: 'opening', for: '1' }],
      [{ type: 'ending', for: '1' }],
      [{ type: 'text' }],
      [{ type: 'destination', for: '1' }],
      [{ type: 'destination', for: '2' }],
      [{ type: 'text' }],
    ],
    portals: {
      '1': {
        id: '1',
        content: [
          [{ type: 'text' }],
          [{ type: 'opening', for: '2' }],
          [{ type: 'ending', for: '2' }],
        ],
        warped: true,
        boundingRect: {
          columnEnd: 5,
          columnStart: 0,
          lineEnd: 6,
          lineStart: 1,
        },
      },

      '2': {
        id: '2',
        content: [[{ type: 'text' }]],
        warped: true,
        boundingRect: {
          columnEnd: 4,
          columnStart: 0,
          lineEnd: 5,
          lineStart: 3,
        },
      },
    },
  })
})

test('left indentation', () => {
  const result = cleanup(
    parse(`
  // PORTAL #1
      abcd
    Hello guys
  // /PORTAL #1

How are you ?
// WARP #1
`),
  )

  // const secondLine = get(1, result.content)
  // expect(secondLine).toBeDefined()
  // expect((secondLine || [])[0]).toBeDefined()
  // const tested = (secondLine || [])[0]
  // expect([(tested || {}).left, (tested || {}).right]).toEqual([2, 14])
  // expect([result.portals['1'].left, result.portals['1'].right]).toEqual([4, 14])
})

test('add virtual tokens', () => {
  const toAdd: Array<[number, Token]> = [
    [
      0,
      {
        id: '0',
        tag: 'warp',
        portal: 'selectionRange',
        original: null,
        left: 0,
      },
    ],
    [
      0,
      {
        id: '1',
        tag: 'portal',
        portal: 'selectionRange',
        pos: 'start',
        original: null,
        left: 0,
      },
    ],
    [
      0,
      {
        id: '2',
        tag: 'portal',
        portal: 'selectionRange',
        pos: 'end',
        original: null,
        left: 0,
      },
    ],
  ]

  let result = cleanup(parse('', { add: toAdd }))
  expect(result).toEqual({
    portals: {
      selectionRange: {
        id: 'selectionRange',
        warped: true,
        content: [[{ type: 'text' }]],
        boundingRect: {
          columnEnd: 0,
          columnStart: 0,
          lineEnd: 0,
          lineStart: 0,
        },
      },
    },
    content: [
      [
        {
          type: 'destination',
          for: 'selectionRange',
        },
        {
          type: 'opening',
          for: 'selectionRange',
        },
        {
          type: 'ending',
          for: 'selectionRange',
        },
      ],
    ],
  })
})

test('move tokens top', () => {
  const result = parse(
    `0
2
3`,
    { move: { id: '1', lineIndex: 0, columnIndex: 0 } },
  )
  const content = map(
    map((x: Symbol) => {
      delete x.boundingRect
      delete x.position.column
      return x
    }),
  )(to2dArray(result.content))

  expect(content).toEqual([
    [
      {
        id: '0',
        type: 'text',
        position: {
          line: 0,
        },
      },
      {
        id: '1',
        type: 'text',
        position: {
          line: 0,
        },
      },
    ],
    [
      {
        id: '2',
        type: 'text',
        position: {
          line: 2,
        },
      },
    ],
  ])
})

test('move simple tokens bottom', () => {
  const result = parse(
    `0
2
3`,
    { move: { id: '1', lineIndex: 2, columnIndex: 0 } },
  )
  const content = map(
    map((x: Symbol) => {
      delete x.boundingRect
      delete x.position.column
      return x
    }),
  )(to2dArray(result.content))

  expect(content).toEqual([
    [
      {
        id: '0',
        type: 'text',
        position: {
          line: 0,
        },
      },
    ],
    [
      {
        id: '1',
        type: 'text',
        position: {
          line: 2,
        },
      },
      {
        id: '2',
        type: 'text',
        position: {
          line: 2,
        },
      },
    ],
  ])
})

test('move complex tokens bottom', () => {
  const result = parse(
    `${comment(portalStart(1))}
1
${comment(portalEnd(1))}
2
${comment(warp(1))}
3
4`,
    { move: { id: '4', lineIndex: 7, columnIndex: 0 } },
  )
  const content = map(
    map((x: Symbol) => {
      delete x.boundingRect
      delete x.position
      return x
    }),
  )(to2dArray(result.content))

  expect(content).toEqual([
    [
      {
        id: '0',
        type: 'opening',
        for: '1',
      },
    ],
    [
      {
        id: '2',
        type: 'ending',
        for: '1',
      },
    ],
    [{ id: '3', type: 'text' }],
    [{ id: '5', type: 'text' }],
    [{ id: '6', type: 'text' }],
    [
      {
        id: '4',
        type: 'destination',
        for: '1',
      },
    ],
  ])
})

test('multiple tokens per line', () => {
  expect(
    cleanupContext(
      parse(`${comment(portalStart(1), portalEnd(1), warp(1))}`),
      (x: Symbol) => {
        delete x.id
        delete x.position
        return x
      },
    ).content,
  ).toEqual([
    [
      {
        type: 'opening',
        boundingRect: {
          lineStart: 0,
          lineEnd: 0,
          columnStart: 0,
          columnEnd: comment('').length + portalStart(1).length,
        },
        for: '1',
      },
      {
        type: 'ending',
        boundingRect: {
          lineStart: 0,
          lineEnd: 0,
          columnStart: comment('').length + portalStart(1).length + 1,
          columnEnd:
            comment('').length +
            portalStart(1).length +
            1 +
            portalEnd(1).length +
            1,
        },
        for: '1',
      },
      {
        type: 'destination',
        boundingRect: {
          lineStart: 0,
          lineEnd: 0,
          columnStart:
            comment('').length +
            portalStart(1).length +
            1 +
            portalEnd(1).length +
            1,
          columnEnd:
            comment('').length +
            portalStart(1).length +
            1 +
            portalEnd(1).length +
            1 +
            warp(1).length +
            1,
        },
        for: '1',
      },
    ],
  ])
})

test('move tokens right', () => {
  expect(
    cleanup(
      parse(`${comment(portalStart(1), portalEnd(1), warp(1))}`, {
        move: { id: '0', lineIndex: 0, columnIndex: 2 },
      }),
    ).content,
  ).toEqual([
    [
      { type: 'ending', for: '1' },
      { type: 'destination', for: '1' },
      { type: 'opening', for: '1' },
    ],
  ])
})
