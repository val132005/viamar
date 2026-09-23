export const FORMULA_VARS = [
  'mesesUso',
  'mesesFull',
  'mesesProrrateo',
  'precioOriginal',
  'precioVigente',
  'precioBase',
] as const

export type FormulaVars = Record<(typeof FORMULA_VARS)[number], number>

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }

const OPS = new Set(['+', '-', '*', '/', '(', ')', ',', '?', ':', '<', '>', '<=', '>=', '==', '!=', '&&', '||'])

export function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\n' || c === '\t') {
      i += 1
      continue
    }
    if (c >= '0' && c <= '9') {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j += 1
      out.push({ t: 'num', v: Number(src.slice(i, j)) })
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j += 1
      out.push({ t: 'id', v: src.slice(i, j) })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (OPS.has(two)) {
      out.push({ t: 'op', v: two })
      i += 2
      continue
    }
    if (OPS.has(c)) {
      out.push({ t: 'op', v: c })
      i += 1
      continue
    }
    throw new Error(`Carácter no permitido en la fórmula: "${c}"`)
  }
  return out
}

class Parser {
  constructor(
    private toks: Tok[],
    private i = 0,
  ) {}

  peek() {
    return this.toks[this.i]
  }

  eat(v?: string) {
    const tok = this.toks[this.i]
    if (!tok) throw new Error('Fórmula incompleta')
    if (v && !(tok.t === 'op' && tok.v === v)) throw new Error(`Se esperaba "${v}"`)
    this.i += 1
    return tok
  }

  parse(): Ast {
    const node = this.ternary()
    if (this.peek()) throw new Error('Sobra texto después de la expresión')
    return node
  }

  ternary(): Ast {
    const cond = this.or()
    const tok = this.peek()
    if (tok?.t === 'op' && tok.v === '?') {
      this.eat('?')
      const a = this.ternary()
      this.eat(':')
      const b = this.ternary()
      return { k: 'tern', cond, a, b }
    }
    return cond
  }

  or(): Ast {
    let left = this.and()
    while (this.peek()?.t === 'op' && this.peek().v === '||') {
      this.eat()
      left = { k: 'bin', op: '||', l: left, r: this.and() }
    }
    return left
  }

  and(): Ast {
    let left = this.cmp()
    while (this.peek()?.t === 'op' && this.peek().v === '&&') {
      this.eat()
      left = { k: 'bin', op: '&&', l: left, r: this.cmp() }
    }
    return left
  }

  cmp(): Ast {
    let left = this.add()
    const tok = this.peek()
    if (tok?.t === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(tok.v)) {
      this.eat()
      left = { k: 'bin', op: tok.v, l: left, r: this.add() }
    }
    return left
  }

  add(): Ast {
    let left = this.mul()
    while (this.peek()?.t === 'op' && (this.peek().v === '+' || this.peek().v === '-')) {
      const eaten = this.eat()
      if (eaten.t !== 'op') throw new Error('Operador esperado')
      left = { k: 'bin', op: eaten.v, l: left, r: this.mul() }
    }
    return left
  }

  mul(): Ast {
    let left = this.unary()
    while (this.peek()?.t === 'op' && (this.peek().v === '*' || this.peek().v === '/')) {
      const eaten = this.eat()
      if (eaten.t !== 'op') throw new Error('Operador esperado')
      left = { k: 'bin', op: eaten.v, l: left, r: this.unary() }
    }
    return left
  }

  unary(): Ast {
    if (this.peek()?.t === 'op' && this.peek().v === '-') {
      this.eat()
      return { k: 'un', op: '-', x: this.unary() }
    }
    return this.primary()
  }

  primary(): Ast {
    const tok = this.peek()
    if (!tok) throw new Error('Fórmula incompleta')
    if (tok.t === 'num') {
      this.eat()
      return { k: 'num', v: tok.v }
    }
    if (tok.t === 'id') {
      this.eat()
      if (this.peek()?.t === 'op' && this.peek().v === '(') {
        this.eat('(')
        const args: Ast[] = []
        if (!(this.peek()?.t === 'op' && this.peek().v === ')')) {
          args.push(this.ternary())
          while (this.peek()?.t === 'op' && this.peek().v === ',') {
            this.eat(',')
            args.push(this.ternary())
          }
        }
        this.eat(')')
        return { k: 'call', name: tok.v, args }
      }
      return { k: 'id', v: tok.v }
    }
    if (tok.t === 'op' && tok.v === '(') {
      this.eat('(')
      const inner = this.ternary()
      this.eat(')')
      return inner
    }
    throw new Error(`Token inesperado: ${tok.v}`)
  }
}

type Ast =
  | { k: 'num'; v: number }
  | { k: 'id'; v: string }
  | { k: 'un'; op: string; x: Ast }
  | { k: 'bin'; op: string; l: Ast; r: Ast }
  | { k: 'tern'; cond: Ast; a: Ast; b: Ast }
  | { k: 'call'; name: string; args: Ast[] }

function collectIds(ast: Ast, into: Set<string>) {
  if (ast.k === 'id') into.add(ast.v)
  if (ast.k === 'un') collectIds(ast.x, into)
  if (ast.k === 'bin') {
    collectIds(ast.l, into)
    collectIds(ast.r, into)
  }
  if (ast.k === 'tern') {
    collectIds(ast.cond, into)
    collectIds(ast.a, into)
    collectIds(ast.b, into)
  }
  if (ast.k === 'call') ast.args.forEach((a) => collectIds(a, into))
}

const ALLOWED = new Set<string>(FORMULA_VARS)
const FUNS = new Set(['min', 'max', 'round'])

export function compileFormula(src: string): Ast {
  const ast = new Parser(tokenize(src)).parse()
  const ids = new Set<string>()
  collectIds(ast, ids)
  for (const id of ids) {
    if (!ALLOWED.has(id)) throw new Error(`Variable no permitida: ${id}`)
  }
  function walk(node: Ast) {
    if (node.k === 'call' && !FUNS.has(node.name)) throw new Error(`Función no permitida: ${node.name}`)
    if (node.k === 'un') walk(node.x)
    if (node.k === 'bin') {
      walk(node.l)
      walk(node.r)
    }
    if (node.k === 'tern') {
      walk(node.cond)
      walk(node.a)
      walk(node.b)
    }
    if (node.k === 'call') node.args.forEach(walk)
  }
  walk(ast)
  return ast
}

function truthy(n: number) {
  return n !== 0
}

function evalAst(ast: Ast, vars: FormulaVars): number {
  switch (ast.k) {
    case 'num':
      return ast.v
    case 'id':
      return vars[ast.v as keyof FormulaVars]
    case 'un':
      return -evalAst(ast.x, vars)
    case 'tern':
      return truthy(evalAst(ast.cond, vars)) ? evalAst(ast.a, vars) : evalAst(ast.b, vars)
    case 'call': {
      const args = ast.args.map((a) => evalAst(a, vars))
      if (ast.name === 'min') return Math.min(...args)
      if (ast.name === 'max') return Math.max(...args)
      if (ast.name === 'round') return Math.round(args[0] ?? 0)
      throw new Error(`Función no permitida: ${ast.name}`)
    }
    case 'bin': {
      const l = evalAst(ast.l, vars)
      const r = evalAst(ast.r, vars)
      switch (ast.op) {
        case '+':
          return l + r
        case '-':
          return l - r
        case '*':
          return l * r
        case '/':
          return r === 0 ? 0 : l / r
        case '<':
          return l < r ? 1 : 0
        case '>':
          return l > r ? 1 : 0
        case '<=':
          return l <= r ? 1 : 0
        case '>=':
          return l >= r ? 1 : 0
        case '==':
          return l === r ? 1 : 0
        case '!=':
          return l !== r ? 1 : 0
        case '&&':
          return truthy(l) && truthy(r) ? 1 : 0
        case '||':
          return truthy(l) || truthy(r) ? 1 : 0
        default:
          throw new Error(`Operador no soportado: ${ast.op}`)
      }
    }
  }
}

export function evaluateFormula(src: string, vars: FormulaVars): number {
  return evalAst(compileFormula(src), vars)
}

export function validateFormula(src: string): string | null {
  try {
    compileFormula(src)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Fórmula inválida'
  }
}
