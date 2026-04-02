const starterCodeMap = {
  c: `#include <stdio.h>

int main(void) {
  printf("Hello World\\n");
  return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello World" << endl;
  return 0;
}
`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}
`,
  javascript: `console.log("Hello World");
`,
  python: `print("Hello World")
`,
  python3: `print("Hello World")
`,
  typescript: `console.log("Hello World");
`,
  nodejs: `console.log("Hello World");
`,
  html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello World</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`,
  css: `body {
  margin: 0;
  font-family: sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
}

h1 {
  color: #111827;
}
`,
  sql: `SELECT 'Hello World';
`,
} as const

function normalizeStarterCodeLanguage(language?: string) {
  const normalized = language?.trim().toLowerCase().replace(/\s+/g, "") || "python3"

  if (normalized === "c++") return "cpp"
  if (normalized === "js") return "javascript"
  if (normalized === "ts") return "typescript"
  if (normalized === "node" || normalized === "node.js") return "nodejs"
  if (normalized === "python-3") return "python3"
  if (normalized === "sqlite") return "sql"

  return normalized
}

export function getStarterCode(language?: string): string {
  const normalizedLanguage = normalizeStarterCodeLanguage(language)

  return starterCodeMap[normalizedLanguage as keyof typeof starterCodeMap] || ""
}
