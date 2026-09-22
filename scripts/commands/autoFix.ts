import { Project } from 'ts-morph'
import { fixAnyKeywords } from './processors/fixAnyKeywords'
import { fixTemplateExpressions } from './processors/fixTemplateExpressions'

export const main = () => {
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

  for (const sf of project.getSourceFiles()) {
    const templateFixed = fixTemplateExpressions(sf)
    const anyFixed = fixAnyKeywords(sf)

    if (templateFixed || anyFixed) {
      sf.saveSync()
    }
  }
  console.log('Auto-fix complete.')
}
