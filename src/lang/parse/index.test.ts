import 'jest'

import { parse } from './index'
import { cleanupContext } from './cleanupContent'
import { Token, Context, Symbol, Content } from '../types'
import { toSortedArray } from '../../libs/SortedMap'
import { map } from 'ramda'

function cleanup(context: Context): any {
  return cleanupContext(context, symbol => {
    delete symbol.id
    return symbol
  })
}

// TODO use this util for better tests, currently left, right etc. make lot of noise in my tests
const mapContent = <T = any>(mapper: (sym: Symbol) => T) => (
  content: Content,
) => map(map(mapper))

test('empty text', () => {
  expect(cleanup(parse(''))).toEqual({
    portals: {},
    content: [[{ type: 'text', start: 0, end: 0, left: 0, right: 0 }]],
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
    content: [[{ type: 'text', start: 0, end: 4, left: 0, right: 13 }]],
  })
})

test('simple', () => {
  expect(
    cleanup(
      parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`),
    ),
  ).toEqual({
    content: [[{ type: 'text', start: 0, end: 6, left: 0, right: 13 }]],
    portals: {},
  })
})

test('with target', () => {
  expect(
    cleanup(
      parse(`
// PORTAL #1
Hello guys
Tadaa
Multiline
// /PORTAL #1

How are you ?
// WARP #1
Hum
`),
    ),
  ).toEqual({
    content: [
      [{ type: 'text', start: 0, end: 0, left: 0, right: 0 }],
      [{ type: 'opening', start: 1, end: 1, left: 0, right: 12, for: '1' }],
      [{ type: 'ending', start: 5, end: 5, left: 0, right: 13, for: '1' }],
      [{ type: 'text', start: 6, end: 7, left: 0, right: 13 }],
      [{ type: 'destination', start: 8, end: 8, left: 0, right: 10, for: '1' }],
      [{ type: 'text', start: 9, end: 10, left: 0, right: 3 }],
    ],
    portals: {
      '1': {
        id: '1',
        start: 1,
        end: 5,
        left: 0,
        right: 10,
        content: [[{ type: 'text', start: 2, end: 4, left: 0, right: 10 }]],
        warped: true,
      },
    },
  })
})

test('malformed', () => {
  expect(
    cleanup(
      parse(`
// PORTAL #1
Hello guys

How are you ?
// WARP #1
`),
    ),
  ).toEqual({
    content: [[{ type: 'text', start: 0, end: 6, left: 0, right: 13 }]],
    portals: {},
  })
})

test('nested', () => {
  expect(
    cleanup(
      parse(`
// PORTAL #1
Hello
// PORTAL #2
guys
// /PORTAL #2
// /PORTAL #1

How are you ?
// WARP #1
// WARP #2
`),
    ),
  ).toEqual({
    content: [
      [{ type: 'text', start: 0, end: 0, left: 0, right: 0 }],
      [{ type: 'opening', start: 1, end: 1, left: 0, right: 12, for: '1' }],
      [{ type: 'ending', start: 6, end: 6, left: 0, right: 13, for: '1' }],
      [{ type: 'text', start: 7, end: 8, left: 0, right: 13 }],
      [{ type: 'destination', start: 9, end: 9, left: 0, right: 10, for: '1' }],
      [
        {
          type: 'destination',
          start: 10,
          end: 10,
          left: 0,
          right: 10,
          for: '2',
        },
      ],
      [{ type: 'text', start: 11, end: 11, left: 0, right: 0 }],
    ],
    portals: {
      '1': {
        id: '1',
        start: 1,
        end: 6,
        content: [
          [{ type: 'text', start: 2, end: 2, left: 0, right: 5 }],
          [{ type: 'opening', start: 3, end: 3, left: 0, right: 12, for: '2' }],
          [{ type: 'ending', start: 5, end: 5, left: 0, right: 13, for: '2' }],
        ],
        warped: true,
        left: 0,
        right: 13,
      },

      '2': {
        id: '2',
        start: 3,
        end: 5,
        content: [[{ type: 'text', start: 4, end: 4, left: 0, right: 4 }]],
        warped: true,
        left: 0,
        right: 4,
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
      },
    ],
  ]

  let result = cleanup(parse('', { add: toAdd }))
  expect(result).toEqual({
    portals: {
      selectionRange: {
        id: 'selectionRange',
        start: 0,
        end: 0,
        left: 0,
        right: 0,
        warped: true,
        content: [[{ type: 'text', start: 0, end: 0, left: 0, right: 0 }]],
      },
    },
    content: [
      [
        {
          type: 'destination',
          for: 'selectionRange',
          start: 0,
          end: 0,
          left: 0,
          right: 0,
        },
        {
          type: 'opening',
          for: 'selectionRange',
          start: 0,
          end: 0,
          left: 0,
          right: 0,
        },
        {
          type: 'ending',
          for: 'selectionRange',
          start: 0,
          end: 0,
          left: 0,
          right: 0,
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
  const content = toSortedArray(result.content)
  expect(content).toEqual([
    [
      { id: '0', type: 'text', start: 0, end: 0, left: 0, right: 1 },
      { id: '1', type: 'text', start: 1, end: 1, left: 0, right: 1 },
    ],
    [{ id: '2', type: 'text', start: 2, end: 2, left: 0, right: 1 }],
  ])
})

test('move simple tokens bottom', () => {
  const result = parse(
    `0
2
3`,
    { move: { id: '1', lineIndex: 2, columnIndex: 0 } },
  )
  const content = toSortedArray(result.content)
  expect(content).toEqual([
    [{ id: '0', type: 'text', start: 0, end: 0, left: 0, right: 1 }],
    [
      { id: '1', type: 'text', start: 1, end: 1, left: 0, right: 1 },
      { id: '2', type: 'text', start: 2, end: 2, left: 0, right: 1 },
    ],
  ])
})

test('move complex tokens bottom', () => {
  const result = parse(
    `// PORTAL #1
1
// /PORTAL #1
2
// WARP #1
3
4`,
    { move: { id: '4', lineIndex: 7, columnIndex: 0 } },
  )
  const content = toSortedArray(result.content)

  expect(content).toEqual([
    [
      {
        id: '0',
        type: 'opening',
        for: '1',
        start: 0,
        end: 0,
        left: 0,
        right: 12,
      },
    ],
    [
      {
        id: '2',
        type: 'ending',
        for: '1',
        start: 2,
        end: 2,
        left: 0,
        right: 13,
      },
    ],
    [{ id: '3', type: 'text', start: 3, end: 3, left: 0, right: 1 }],
    [{ id: '5', type: 'text', start: 5, end: 5, left: 0, right: 1 }],
    [{ id: '6', type: 'text', start: 6, end: 6, left: 0, right: 1 }],
    [
      {
        id: '4',
        type: 'destination',
        for: '1',
        start: 4,
        end: 4,
        left: 0,
        right: 10,
      },
    ],
  ])
})

test('multiple tokens per line', () => {
  expect(cleanup(parse(`// PORTAL #1, /PORTAL #1, WARP #1`)).content).toEqual([
    [
      { type: 'opening', start: 0, end: 0, left: 0, right: 12, for: '1' },
      { type: 'ending', start: 0, end: 0, left: 1, right: 11, for: '1' },
      { type: 'destination', start: 0, end: 0, left: 1, right: 8, for: '1' },
    ],
  ])
})
