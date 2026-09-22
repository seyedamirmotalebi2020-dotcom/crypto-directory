import { prisma } from '../config/db.js'

export async function findAllCoins() {
  return prisma.coin.findMany({ orderBy: { sortOrder: 'asc' } })
}

export async function findAllPaymentMethods() {
  return prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } })
}

export async function findAllFeatures() {
  return prisma.feature.findMany({ orderBy: { name: 'asc' } })
}