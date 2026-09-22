import { prisma } from '../config/db.js'

export async function findAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export async function findCategoryBySlug(slug) {
  return prisma.category.findUnique({ where: { slug } })
}