import { Token } from '../types'

export function tokenize(text: string): Array<[number, Token]> {
  let id = 0
  return text
    .split('\n')
    .map((line, index) => {
      return tokenizeLine(line).map(token => [index, token] as [number, Token])
    })
    .reduce((acc, x) => {
      acc.push(...x)
      return acc
    }, [])

  function tokenizeLine(line: string) {
    return line.split(',').map(_tokenize)

    function _tokenize(str: string) {
      let token: Token = {
        id: '' + id++,
        tag: 'text',
        portal: undefined,
        pos: undefined,
        original: str,
      }

      if (isComment(line)) {
        str.split(' ').forEach(word => {
          if (word === 'WARP') {
            token.tag = 'warp'
          }
          if (word === 'PORTAL') {
            token.tag = 'portal'
            token.pos = 'start'
          }
          if (word === '/PORTAL') {
            token.tag = 'portal'
            token.pos = 'end'
          }
          if (token.tag && word.startsWith('#')) {
            token.portal = word.replace(/^#/, '')
          }
        })
      }

      return token
    }
  }
}

function isComment(str: string) {
  return str.trim().startsWith('//')
}
