import 'jest'

import { parse } from './parser'

test('empty text', () => {
  expect(parse('')).toEqual({
    portals: {},
    content: [{ type: 'text', start: 0, end: 0 }],
  });
});

test('no annotations', () => {
  expect(parse(`
Hello guys

How are you ?
`)).toEqual({
    portals: {},
    content: [{ type: 'text', start: 0, end: 4 }],
  });
});

test('simple', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`)).toEqual({
    content: [{ type: 'text', start: 0, end: 6 }],
    portals: {}
  });
});

test('with target', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
// WARP #1
`)).toEqual({
    content: [
      { type: 'text', start: 0, end: 0 },
      { type: 'opening', start: 1, end: 1, for: '1' },
      { type: 'ending', start: 3, end: 3, for: '1' },
      { type: 'text', start: 4, end: 5 },
      { type: 'destination', start: 6, end: 6, for: '1' },
      { type: 'text', start: 7, end: 7 },
    ],
    portals: {
      '1': { id: '1', start: 2, end: 2, content: [{ type: 'text', start: 2, end: 2 }], warped: true }
    }
  })
})

test('malformed', () => {
  expect(parse(`
// PORTAL #1
Hello guys

How are you ?
// WARP #1
`)).toEqual({
    content: [{ type: 'text', start: 0, end: 6 }],
    portals: {}
  });
});

// Balec aussi
test('nested', () => {
  expect(parse(`
// PORTAL #1
Hello
// PORTAL #2
guys
// /PORTAL #2
// /PORTAL #1

How are you ?
// WARP #1
// WARP #2
`)).toEqual({
    content: [
      { type: 'text', start: 0, end: 0 },
      { type: 'opening', start: 1, end: 1, for: '1' },
      { type: 'ending', start: 6, end: 6, for: '1' },
      { type: 'text', start: 7, end: 8 },
      { type: 'destination', start: 9, end: 9, for: '1' },
      { type: 'destination', start: 10, end: 10, for: '2' },
      { type: 'text', start: 11, end: 11 },
    ],
    portals: {
      '1': {
        id: '1',
        start: 2,
        end: 5,
        content: [
          { type: 'text', start: 2, end: 2 },
          { type: 'opening', start: 3, end: 3, for: '2' },
          { type: 'ending', start: 5, end: 5, for: '2' },
        ],
        warped: true,
      },

      '2': {
        id: '2',
        start: 4,
        end: 4,
        content: [{ type: 'text', start: 4, end: 4 },],
        warped: true,
      },
    },
  });
});

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
