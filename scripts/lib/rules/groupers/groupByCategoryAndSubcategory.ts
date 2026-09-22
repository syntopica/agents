import type { RuleItem } from '../types/RuleItem'

/**
 * @param {Array<{ rel: string, content: string }>} items
 * @returns {Array<{ category: string, subgroups: Array<{ subcategory: string, rules: Array<{ rel: string, content: string }> }> }>}
 */

export function groupByCategoryAndSubcategory(items: RuleItem[]) {
  const map: Record<string, Record<string, RuleItem[]>> = {}
  for (const item of items) {
    const parts = item.rel.split('/')
    const category = parts.length === 1 ? 'root' : (parts[0] ?? 'root')
    const subcategory = parts.length >= 3 ? (parts[1] ?? '') : ''

    const categoryMap = map[category] ?? (map[category] = {})
    const subcatList =
      categoryMap[subcategory] ?? (categoryMap[subcategory] = [])
    subcatList.push(item)
  }

  const categories = Object.keys(map).sort((a: string, b: string) => {
    if (a === 'root') return -1
    if (b === 'root') return 1
    return a.localeCompare(b)
  })
  return categories.map((category: string) => {
    const subcatMap = map[category] ?? {}
    const subcategories = Object.keys(subcatMap).sort(
      (a: string, b: string) => {
        // Keep empty subcategory first for readability (rules directly under category).
        if (a === '') return -1
        if (b === '') return 1
        return a.localeCompare(b)
      },
    )

    const subgroups = subcategories.map((subcategory: string) => {
      const rules = (subcatMap[subcategory] ?? [])
        .slice()
        .sort((a: RuleItem, b: RuleItem) => a.rel.localeCompare(b.rel))
      return { subcategory, rules }
    })

    return { category, subgroups }
  })
}
