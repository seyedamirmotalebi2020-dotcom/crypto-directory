// src/repositories/sites.repo.js
import { prisma } from '../config/db.js'
import { getVoteBreakdownForSites } from './votes.repo.js'

export async function findSites({ where, orderBy, skip, take }) {
  const [rows, total] = await Promise.all([
    prisma.site.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        categories: { include: { category: true } },
        features:   { include: { feature: true } },
        offers: {
          where: { isActive: true },
          include: { coin: true, paymentMethod: true },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.site.count({ where }),
  ])

  // One extra query for the vote breakdown of this page's sites
  const voteBreakdown = await getVoteBreakdownForSites(rows.map(r => r.id))

  return { rows, total, voteBreakdown }
}

export async function findSiteBySlug(slug) {
  return prisma.site.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: true } },
      features:   { include: { feature: true } },
      offers: {
        where: { isActive: true },
        include: { coin: true, paymentMethod: true },
      },
      votes: { select: { vote: true } },
    },
  })
}

export async function findSiteIdBySlug(slug) {
  return prisma.site.findUnique({
    where: { slug },
    select: { id: true, trustScore: true },
  })
}
