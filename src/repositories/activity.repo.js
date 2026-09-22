// src/repositories/activity.repo.js
import { prisma } from '../config/db.js'

export async function findRecentVotes(limit = 20) {
  return prisma.vote.findMany({
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: {
      site: {
        select: { id: true, slug: true, name: true },
      },
    },
  })
}

export async function countVotesSince(since) {
  return prisma.vote.count({
    where: { updatedAt: { gte: since } },
  })
}