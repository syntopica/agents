import { Project } from 'ts-morph'

export const main = () => {
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

  const sourceFiles = project
    .getSourceFiles()
    .filter((f) => f.getFilePath().includes('scripts/'))

  for (const sourceFile of sourceFiles) {
    // We will use brute force ts-morph to split everything.
    // Actually, wait, let's write a script that identifies target files and creates a list.
    // We don't want to break the world in a way we can't recover.

    // A file is "atomic" if it contains exactly one exported declaration, and NO other declarations (except imports).
    const funcs = sourceFile.getFunctions().length
    // A variable statement could be `const x = 1` or `const f = () => {}`
    const vars = sourceFile.getVariableStatements().length
    const classes = sourceFile.getClasses().length
    const total = funcs + vars + classes

    if (total > 1) {
      console.log(
        `\nFile has multiple statements (potential unexported helpers): ${String(sourceFile.getFilePath())}`,
      )
    }
  }
}
