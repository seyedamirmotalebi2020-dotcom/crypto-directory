// src/services/activity.service.js
import * as repo from '../repositories/activity.repo.js'

const HOUR = 60 * 60 * 1000
const DAY  = 24 * HOUR

export async function getRecentActivity() {
  const now = Date.now()

  const [votes, lastHour, last24h, totalVotes] = await Promise.all([
    repo.findRecentVotes(15),
    repo.countVotesSince(new Date(now - HOUR)),
    repo.countVotesSince(new Date(now - DAY)),
    repo.countVotesSince(new Date(0)),
  ])

  return {
    items: votes.map((v) => ({
      id:         v.id,
      vote:       v.vote,
      siteSlug:   v.site.slug,
      siteName:   v.site.name,
      timestamp:  v.updatedAt.toISOString(),
    })),
    stats: {
      lastHour,
      last24h,
      total: totalVotes,
    },
  }
}