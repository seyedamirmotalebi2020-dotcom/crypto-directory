// src/repositories/votes.repo.js
import { prisma } from '../config/db.js'

export async function upsertVote({ siteId, vote, fingerprint, ipHash, userAgent }) {
  return prisma.vote.upsert({
    where: { siteId_fingerprint: { siteId, fingerprint } },
    update: { vote, ipHash, userAgent },
    create: { siteId, vote, fingerprint, ipHash, userAgent },
  })
}

export async function getVoteCounts(siteId) {
  const rows = await prisma.vote.groupBy({
    by: ['vote'],
    where: { siteId },
    _count: { vote: true },
  })
  const counts = { trustworthy: 0, scam: 0, unsure: 0 }
  for (const r of rows) counts[r.vote] = r._count.vote
  return counts
}

export async function getUserVote(siteId, fingerprint) {
  const row = await prisma.vote.findUnique({
    where: { siteId_fingerprint: { siteId, fingerprint } },
    select: { vote: true },
  })
  return row?.vote ?? null
}

export async function getVoteBreakdownForSites(siteIds) {
  if (!siteIds.length) return {}
  const rows = await prisma.vote.groupBy({
    by: ['siteId', 'vote'],
    where: { siteId: { in: siteIds } },
    _count: { vote: true },
  })
  const map = {}
  for (const r of rows) {
    if (!map[r.siteId]) map[r.siteId] = { trustworthy: 0, scam: 0, unsure: 0 }
    map[r.siteId][r.vote] = r._count.vote
  }
  return map
}