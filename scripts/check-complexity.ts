#!/usr/bin/env ts-node
/**
 * Code Complexity Analysis Script
 *
 * Enforces:
 * - Cyclomatic complexity < 10 per function
 * - File size < 250 lines
 * - No deeply nested code (max depth 4)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import * as ts from 'typescript'

interface ComplexityIssue {
  file: string
  line: number
  function: string
  complexity: number
  type: 'complexity' | 'file-size' | 'nesting'
}

const MAX_COMPLEXITY = 10
const MAX_FILE_LINES = 250
const MAX_NESTING_DEPTH = 4

const issues: ComplexityIssue[] = []

function analyzeFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').length

  // Check file size
  if (lines > MAX_FILE_LINES) {
    issues.push({
      file: filePath,
      line: 1,
      function: '<file>',
      complexity: lines,
      type: 'file-size'
    })
  }

  // Parse TypeScript AST
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  function visit(node: ts.Node, depth = 0): void {
    // Check nesting depth
    if (depth > MAX_NESTING_DEPTH) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
      issues.push({
        file: filePath,
        line,
        function: '<nested-block>',
        complexity: depth,
        type: 'nesting'
      })
    }

    // Calculate cyclomatic complexity for functions
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node)
    ) {
      const complexity = calculateComplexity(node)
      const functionName = getFunctionName(node)
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1

      if (complexity > MAX_COMPLEXITY) {
        issues.push({
          file: filePath,
          line,
          function: functionName,
          complexity,
          type: 'complexity'
        })
      }
    }

    ts.forEachChild(node, (child) => visit(child, depth + 1))
  }

  visit(sourceFile)
}

function calculateComplexity(node: ts.Node): number {
  let complexity = 1 // Base complexity

  function visit(n: ts.Node): void {
    // Count decision points
    if (
      ts.isIfStatement(n) ||
      ts.isConditionalExpression(n) ||
      ts.isWhileStatement(n) ||
      ts.isForStatement(n) ||
      ts.isForInStatement(n) ||
      ts.isForOfStatement(n) ||
      ts.isCaseClause(n) ||
      ts.isCatchClause(n)
    ) {
      complexity++
    }

    // Count logical operators
    if (ts.isBinaryExpression(n)) {
      if (
        n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        n.operatorToken.kind === ts.SyntaxKind.BarBarToken
      ) {
        complexity++
      }
    }

    ts.forEachChild(n, visit)
  }

  visit(node)
  return complexity
}

function getFunctionName(node: ts.FunctionLikeDeclaration): string {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text
  }
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text
  }
  if (ts.isArrowFunction(node)) {
    // Try to get variable name for arrow functions
    const parent = node.parent
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text
    }
  }
  return '<anonymous>'
}

function scanDirectory(dir: string): void {
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        scanDirectory(fullPath)
      }
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      analyzeFile(fullPath)
    }
  }
}

function main(): void {
  const srcDir = join(__dirname, '../apps/api/src')

  console.log('🔍 Analyzing code complexity...\n')
  scanDirectory(srcDir)

  if (issues.length === 0) {
    console.log('✅ All complexity checks passed!')
    process.exit(0)
  }

  // Group issues by type
  const complexityIssues = issues.filter(i => i.type === 'complexity')
  const fileSizeIssues = issues.filter(i => i.type === 'file-size')
  const nestingIssues = issues.filter(i => i.type === 'nesting')

  if (complexityIssues.length > 0) {
    console.log(`❌ Cyclomatic Complexity Issues (${complexityIssues.length}):`)
    complexityIssues.forEach(issue => {
      const relPath = relative(process.cwd(), issue.file)
      console.log(`  ${relPath}:${issue.line} - ${issue.function}() has complexity ${issue.complexity} (max: ${MAX_COMPLEXITY})`)
    })
    console.log()
  }

  if (fileSizeIssues.length > 0) {
    console.log(`⚠️  File Size Issues (${fileSizeIssues.length}):`)
    fileSizeIssues.forEach(issue => {
      const relPath = relative(process.cwd(), issue.file)
      console.log(`  ${relPath} has ${issue.complexity} lines (max: ${MAX_FILE_LINES})`)
    })
    console.log()
  }

  if (nestingIssues.length > 0) {
    console.log(`⚠️  Nesting Depth Issues (${nestingIssues.length}):`)
    nestingIssues.forEach(issue => {
      const relPath = relative(process.cwd(), issue.file)
      console.log(`  ${relPath}:${issue.line} has depth ${issue.complexity} (max: ${MAX_NESTING_DEPTH})`)
    })
    console.log()
  }

  // Exit with error if complexity issues found (file size is just warning)
  if (complexityIssues.length > 0) {
    console.error('❌ Complexity check failed!')
    process.exit(1)
  } else {
    console.log('⚠️  Some warnings found, but build continues')
    process.exit(0)
  }
}

main()
