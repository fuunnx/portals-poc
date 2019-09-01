import 'jest'

import { parse } from '.'
import { cleanupContent } from './cleanupContent'

test('empty text', () => {
  expect(cleanupContent(parse(''))).toEqual({
    portals: {},
    content: [[{ type: 'text', start: 0, end: 0, left: 0, right: 0 }]],
  })
})

test('no annotations', () => {
  expect(
    cleanupContent(parse(`
Hello guys

How are you ?
`)),
  ).toEqual({
    portals: {},
    content: [[{ type: 'text', start: 0, end: 4, left: 0, right: 13 }]],
  })
})

test('simple', () => {
  expect(
    cleanupContent(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`)),
  ).toEqual({
    content: [[{ type: 'text', start: 0, end: 6, left: 0, right: 13 }]],
    portals: {},
  })
})

test('with target', () => {
  expect(
    cleanupContent(parse(`
// PORTAL #1
Hello guys
Tadaa
Multiline
// /PORTAL #1

How are you ?
// WARP #1
`)),
  ).toEqual({
    content: [
      [{ type: 'text', start: 0, end: 0, left: 0, right: 0 }],
      [{ type: 'opening', start: 1, end: 1, left: 0, right: 12, for: '1' }],
      [{ type: 'ending', start: 5, end: 5, left: 0, right: 13, for: '1' }],
      [{ type: 'text', start: 6, end: 7, left: 0, right: 13 }],
      [{ type: 'destination', start: 8, end: 8, left: 0, right: 10, for: '1' }],
      [{ type: 'text', start: 9, end: 9, left: 0, right: 0 }],
    ],
    portals: {
      '1': {
        id: '1',
        start: 2,
        end: 4,
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
    cleanupContent(parse(`
// PORTAL #1
Hello guys

How are you ?
// WARP #1
`)),
  ).toEqual({
    content: [[{ type: 'text', start: 0, end: 6, left: 0, right: 13 }]],
    portals: {},
  })
})

// Balec aussi
test('nested', () => {
  expect(
    cleanupContent(parse(`
// PORTAL #1
Hello
// PORTAL #2
guys
// /PORTAL #2
// /PORTAL #1

How are you ?
// WARP #1
// WARP #2
`)),
  ).toEqual({
    content: [
      [{ type: 'text', start: 0, end: 0, left: 0, right: 0 }],
      [{ type: 'opening', start: 1, end: 1, left: 0, right: 12, for: '1' }],
      [{ type: 'ending', start: 6, end: 6, left: 0, right: 13, for: '1' }],
      [{ type: 'text', start: 7, end: 8, left: 0, right: 13 }],
      [{ type: 'destination', start: 9, end: 9, left: 0, right: 10, for: '1' }],
      [{ type: 'destination', start: 10, end: 10, left: 0, right: 10, for: '2' }],
      [{ type: 'text', start: 11, end: 11, left: 0, right: 0 }],
    ],
    portals: {
      '1': {
        id: '1',
        start: 2,
        end: 5,
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
        start: 4,
        end: 4,
        content: [[{ type: 'text', start: 4, end: 4, left: 0, right: 4 }]],
        warped: true,
        left: 0,
        right: 4,
      },
    },
  })
})

test('left indentation', () => {
  const result = cleanupContent(parse(`
  // PORTAL #1
      abcd
    Hello guys
  // /PORTAL #1

How are you ?
// WARP #1
`))

  // const secondLine = get(1, result.content)
  // expect(secondLine).toBeDefined()
  // expect((secondLine || [])[0]).toBeDefined()
  // const tested = (secondLine || [])[0]
  // expect([(tested || {}).left, (tested || {}).right]).toEqual([2, 14])
  // expect([result.portals['1'].left, result.portals['1'].right]).toEqual([4, 14])
})

// let's keep it simple for now
// test('superposed', () => {
//   expect(parse(`
// // PORTAL #2
// Hello
// // PORTAL #1
// guys
// // /PORTAL #2
// // /PORTAL #1

// How are you ?
// // WARP #1
// // WARP #2
// `)).toEqual({
//     content: [
//       { type: 'text', start: 0, end: 0 },
//       { type: 'opening', start: 1, end: 1, for: '2' },
//       { type: 'ending', start: 6, end: 6, for: '1' },
//       { type: 'text', start: 7, end: 8 },
//       { type: 'destination', start: 9, end: 9, for: '1' },
//       { type: 'destination', start: 10, end: 10, for: '2' },
//       { type: 'text', start: 11, end: 11 },
//     ],
//     portals: {
//       '1': {
//         id: '1',
//         start: 2,
//         end: 5,
//         content: [
//           { type: 'text', start: 2, end: 2 },
//           { type: 'opening', start: 3, end: 3, for: '2' },
//           { type: 'ending', start: 5, end: 5, for: '2' },
//         ],
//         warped: true,
//       },

//       '2': {
//         id: '2',
//         start: 4,
//         end: 4,
//         content: [{ type: 'text', start: 4, end: 4 },],
//         warped: true,
//       },
//     },
//   });
// });
