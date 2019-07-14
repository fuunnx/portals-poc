import 'jest'

import { parse } from './parser'

test('empty text', () => {
  expect(parse('')).toEqual({
    portals: {},
    content: [''],
  });
});

test('no annotations', () => {
  expect(parse(`
Hello guys

How are you ?
`)).toEqual({
    portals: {},
    content: [`
Hello guys

How are you ?
`,
    ],
  });
});

test('simple', () => {
  expect(parse(`
// PORTAL #1
Hello guys
// /PORTAL #1

How are you ?
`)).toEqual({
    content: [
      `
// PORTAL #1`,
      { type: 'placeholder', for: '1' },
      `// /PORTAL #1

How are you ?
`
    ],
    portals: {
      '1': { id: '1', start: 2, end: 2, content: ['Hello guys'] }
    }
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
      `
// PORTAL #1`,
      { type: 'placeholder', for: '1' },
      `// /PORTAL #1

How are you ?
// WARP #1`,
      { type: 'destination', for: '1' },
      ``
    ],
    portals: {
      '1': { id: '1', start: 2, end: 2, content: ['Hello guys'] }
    }
  })
})

// balec !
// Pour que ça fonctionne -> un premier passage pour récupérer les portails completes, puis construction de l'arbre
// test('malformed', () => {
//   expect(parse(`
// // PORTAL #1
// Hello guys

// How are you ?
// // WARP #1
// `)).toEqual({
//     content: [`
// // PORTAL #1
// Hello guys

// How are you ?
// // WARP #1
// `
//     ],
//     portals: {}
//   });
// });

// Balec aussi
// test('nested', () => {
//   expect(parse(`
// // PORTAL #1
// Hello
// // PORTAL #2
// guys
// // /PORTAL #2
// // /PORTAL #1

// How are you ?
// // WARP #1
// `)).toEqual({
//     children: [
//       `
// // PORTAL #1`,
//       { type: 'placeholder', for: '1' },
//       `// /PORTAL #1

// How are you ?
// // WARP #1`,
//       { type: 'destination', for: '1' },
//       ``
//     ],
//     portals: {
//       '1': {
//         id: '1',
//         start: 2,
//         end: 5,
//         content: [
//           `Hello
// // PORTAL #2`,
//           { type: 'placeholder', for: '2' },
//           `// /PORTAL #2`
//         ],
//       },

//       '2': {
//         id: '2',
//         start: 4,
//         end: 4,
//         content: ['guys'],
//       },

//     },

//   });
// });

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
// `)).toEqual({
//     children: [
//       `
// // PORTAL #2`,
//       { type: 'placeholder', for: '1' },
//       `// PORTAL #1

// How are you ?
// // WARP #1`,
//       { type: 'destination', for: '1' },
//       ``
//     ],
//     portals: {
//       '1': {
//         id: '1',
//         start: 2,
//         end: 5,
//         content: [
//           `Hello
// // PORTAL #2`,
//           { type: 'placeholder', for: '2' },
//           `// /PORTAL #2`
//         ],
//       },

//       '2': {
//         id: '2',
//         start: 4,
//         end: 4,
//         content: ['guys'],
//       },

//     },

//   });
// });
