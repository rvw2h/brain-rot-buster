// BODMAS Expression Generator using AST approach

type Operator = '+' | '-' | '×' | '÷';

interface ASTNode {
  type: 'number' | 'operation';
  value?: number;
  op?: Operator;
  left?: ASTNode;
  right?: ASTNode;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getOpsForLevel(level: number): Operator[] {
  if (level === 1) return ['+', '-', '×'];
  return ['+', '-', '×', '÷'];
}

function getNumRange(level: number): [number, number] {
  if (level === 1) return [1, 9];
  if (level === 2) return [1, 20];
  return [1, 30];
}

function getTermCount(level: number): number {
  if (level === 1) return randInt(2, 3);
  if (level === 2) return randInt(3, 5);
  return randInt(3, 5);
}

function countOps(node: ASTNode, op: Operator): number {
  if (node.type === 'number') return 0;
  const self = node.op === op ? 1 : 0;
  return self + countOps(node.left!, op) + countOps(node.right!, op);
}

function hasChainedDivision(node: ASTNode): boolean {
  if (node.type === 'number') return false;
  if (node.op === '÷' && node.left?.type === 'operation' && node.left.op === '÷') return true;
  if (node.op === '÷' && node.right?.type === 'operation' && node.right.op === '÷') return true;
  return hasChainedDivision(node.left!) || hasChainedDivision(node.right!);
}

function buildAST(terms: number, ops: Operator[], numRange: [number, number]): ASTNode {
  if (terms === 1) {
    return { type: 'number', value: randInt(numRange[0], numRange[1]) };
  }

  const splitAt = randInt(1, terms - 1);
  const op = ops[randInt(0, ops.length - 1)];
  let left = buildAST(splitAt, ops, numRange);
  let right = buildAST(terms - splitAt, ops, numRange);

  // For division, ensure clean result
  if (op === '÷') {
    const divisor = randInt(2, Math.min(9, numRange[1]));
    const multiplier = randInt(1, Math.floor(numRange[1] / divisor));
    left = { type: 'number', value: divisor * multiplier };
    right = { type: 'number', value: divisor };
  }

  return { type: 'operation', op, left, right };
}

function evaluate(node: ASTNode): number {
  if (node.type === 'number') return node.value!;

  const l = evaluate(node.left!);
  const r = evaluate(node.right!);

  switch (node.op) {
    case '+': return l + r;
    case '-': return l - r;
    case '×': return l * r;
    case '÷': return r === 0 ? NaN : l / r;
    default: return NaN;
  }
}

function formatAST(node: ASTNode, parentOp?: Operator, isRight?: boolean): string {
  if (node.type === 'number') return String(node.value);

  const expr = `${formatAST(node.left!, node.op)} ${node.op} ${formatAST(node.right!, node.op, true)}`;

  const needsParens = parentOp && shouldWrap(parentOp, node.op!, isRight);
  return needsParens ? `(${expr})` : expr;
}

function shouldWrap(parentOp: Operator, childOp: Operator, isRight?: boolean): boolean {
  const prec: Record<Operator, number> = { '+': 1, '-': 1, '×': 2, '÷': 2 };
  if (prec[childOp] < prec[parentOp]) return true;
  if (isRight && prec[childOp] === prec[parentOp] && (parentOp === '-' || parentOp === '÷')) return true;
  return false;
}

export interface MathQuestion {
  expression: string;
  answer: number;
  level: number;
}

export function getLevelForQuestion(questionNumber: number): number {
  if (questionNumber <= 5) return 1;
  if (questionNumber <= 15) return 2;
  return 3;
}

export function generateQuestion(level: number): MathQuestion {
  const ops = getOpsForLevel(level);
  const numRange = getNumRange(level);
  const terms = getTermCount(level);

  for (let attempt = 0; attempt < 50; attempt++) {
    const tree = buildAST(terms, ops, numRange);
    const result = evaluate(tree);

    // Constraints: positive integer, max 1 division, max 2 multiplications, no chained divisions
    if (
      Number.isInteger(result) &&
      result >= 0 &&
      result <= 9999 &&
      countOps(tree, '÷') <= 1 &&
      countOps(tree, '×') <= 2 &&
      !hasChainedDivision(tree)
    ) {
      const expression = formatAST(tree);
      return { expression, answer: result, level };
    }
  }

  // Fallback simple question
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  return { expression: `${a} + ${b}`, answer: a + b, level: 1 };
}
