import * as repo from '../repositories/categories.repo.js'

export async function getCategoryTree() {
  const flat = await repo.findAllCategories()

  const byId = new Map()
  for (const c of flat) byId.set(c.id, { ...c, children: [] })

  const roots = []
  for (const c of flat) {
    const node = byId.get(c.id)
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}