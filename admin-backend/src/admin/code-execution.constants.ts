export const LANGUAGE_MAP = {
  C: 50,
  'C++': 54,
  Java: 62,
  Python: 71,
  'JavaScript / Node.js': 63,
  Go: 60,
  Rust: 73,
  Swift: 83,
  R: 80,
  Prolog: 85,
} as const

export type ExecutionEngine = 'judge0' | 'sql' | 'mongodb'

export type SupportedLanguageKey =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'go'
  | 'rust'
  | 'swift'
  | 'r'
  | 'prolog'
  | 'sql'
  | 'mongodb'

export const STARTER_CODE: Record<SupportedLanguageKey, string> = {
  c: [
    '#include <stdio.h>',
    '',
    'int main(void) {',
    '  // Read input and solve the problem',
    '  printf("Hello from C\\n");',
    '  return 0;',
    '}',
  ].join('\n'),
  cpp: [
    '#include <bits/stdc++.h>',
    'using namespace std;',
    '',
    'int main() {',
    '  ios::sync_with_stdio(false);',
    '  cin.tie(nullptr);',
    '',
    '  // Read input and solve the problem',
    '  cout << "Hello from C++" << "\\n";',
    '  return 0;',
    '}',
  ].join('\n'),
  java: [
    'import java.io.*;',
    'import java.util.*;',
    '',
    'public class Main {',
    '  public static void main(String[] args) throws Exception {',
    '    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));',
    '    // Read input and solve the problem',
    '    System.out.println("Hello from Java");',
    '  }',
    '}',
  ].join('\n'),
  python: [
    'def solve() -> None:',
    '    # Read input and solve the problem',
    "    print('Hello from Python')",
    '',
    "if __name__ == '__main__':",
    '    solve()',
  ].join('\n'),
  javascript: [
    "const fs = require('fs')",
    '',
    "const input = fs.readFileSync(0, 'utf8').trim()",
    '// Parse input and solve the problem',
    "console.log('Hello from Node.js')",
  ].join('\n'),
  go: [
    'package main',
    '',
    'import "fmt"',
    '',
    'func main() {',
    '    // Read input and solve the problem',
    '    fmt.Println("Hello from Go")',
    '}',
  ].join('\n'),
  rust: [
    'fn main() {',
    '    // Read input and solve the problem',
    '    println!("Hello from Rust");',
    '}',
  ].join('\n'),
  swift: [
    'import Foundation',
    '',
    '// Read input and solve the problem',
    'print("Hello from Swift")',
  ].join('\n'),
  r: [
    '# Read input and solve the problem',
    'cat("Hello from R\\n")',
  ].join('\n'),
  prolog: [
    '% Define your predicates and query here.',
    'main :-',
    "    writeln('Hello from Prolog').",
  ].join('\n'),
  sql: [
    '-- SQL playground template',
    'CREATE TEMP TABLE users (',
    '  id INT PRIMARY KEY,',
    '  name VARCHAR(100),',
    '  course VARCHAR(100)',
    ');',
    '',
    "INSERT INTO users (id, name, course) VALUES",
    "  (1, 'Ada Lovelace', 'Algorithms'),",
    "  (2, 'Grace Hopper', 'Core Engineering'),",
    "  (3, 'Linus Torvalds', 'Systems');",
    '',
    'SELECT id, name, course',
    'FROM users',
    "WHERE course = 'Algorithms';",
  ].join('\n'),
  mongodb: [
    '// MongoDB read-only query template',
    'db.users.find(',
    '  { active: true },',
    '  { _id: 0, name: 1, email: 1 }',
    ')',
  ].join('\n'),
}

export type SupportedLanguage = {
  description: string
  engine: ExecutionEngine
  judge0Id: number | null
  key: SupportedLanguageKey
  monacoLanguage: string
  name: string
  order: number
  starterCode: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    key: 'python',
    name: 'Python',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Python,
    monacoLanguage: 'python',
    starterCode: STARTER_CODE.python,
    order: 0,
    description: 'Fast iteration with a clean stdin/stdout template.',
  },
  {
    key: 'javascript',
    name: 'JavaScript / Node.js',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP['JavaScript / Node.js'],
    monacoLanguage: 'javascript',
    starterCode: STARTER_CODE.javascript,
    order: 1,
    description: 'Node.js template with fs-based stdin reading.',
  },
  {
    key: 'java',
    name: 'Java',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Java,
    monacoLanguage: 'java',
    starterCode: STARTER_CODE.java,
    order: 2,
    description: 'BufferedReader starter with a public Main class.',
  },
  {
    key: 'cpp',
    name: 'C++',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP['C++'],
    monacoLanguage: 'cpp',
    starterCode: STARTER_CODE.cpp,
    order: 3,
    description: 'Competitive-programming style main function.',
  },
  {
    key: 'c',
    name: 'C',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.C,
    monacoLanguage: 'c',
    starterCode: STARTER_CODE.c,
    order: 4,
    description: 'Minimal C entry point with stdout output.',
  },
  {
    key: 'go',
    name: 'Go',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Go,
    monacoLanguage: 'go',
    starterCode: STARTER_CODE.go,
    order: 5,
    description: 'Minimal runnable Go program.',
  },
  {
    key: 'rust',
    name: 'Rust',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Rust,
    monacoLanguage: 'rust',
    starterCode: STARTER_CODE.rust,
    order: 6,
    description: 'Small Rust main function ready to compile.',
  },
  {
    key: 'swift',
    name: 'Swift',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Swift,
    monacoLanguage: 'swift',
    starterCode: STARTER_CODE.swift,
    order: 7,
    description: 'Minimal Swift program for quick experiments.',
  },
  {
    key: 'r',
    name: 'R',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.R,
    monacoLanguage: 'r',
    starterCode: STARTER_CODE.r,
    order: 8,
    description: 'Simple R script with immediate console output.',
  },
  {
    key: 'prolog',
    name: 'Prolog',
    engine: 'judge0',
    judge0Id: LANGUAGE_MAP.Prolog,
    monacoLanguage: 'plaintext',
    starterCode: STARTER_CODE.prolog,
    order: 9,
    description: 'Basic predicate template for logic programming.',
  },
  {
    key: 'sql',
    name: 'SQL',
    engine: 'sql',
    judge0Id: null,
    monacoLanguage: 'sql',
    starterCode: STARTER_CODE.sql,
    order: 10,
    description: 'Transactional SQL sandbox for CREATE, INSERT, and SELECT style practice.',
  },
  {
    key: 'mongodb',
    name: 'NoSQL (MongoDB)',
    engine: 'mongodb',
    judge0Id: null,
    monacoLanguage: 'javascript',
    starterCode: STARTER_CODE.mongodb,
    order: 11,
    description: 'Read-only MongoDB query runner for find, aggregate, and count patterns.',
  },
]

