// src/services/votes.service.js
import * as votesRepo from '../repositories/votes.repo.js'
import * as sitesRepo from '../repositories/sites.repo.js'
import { hashFingerprint, hashIp } from '../utils/fingerprint.js'

const VOTE_VALUES = new Set(['trustworthy', 'scam', 'unsure'])
const MIN_VOTES_FOR_COMMUNITY = 3

export function computeCommunityScore(counts) {
  const total = counts.trustworthy + counts.scam + counts.unsure
  if (total < MIN_VOTES_FOR_COMMUNITY) return null
  // trustworthy = 100, unsure = 50, scam = 0
  const weighted = counts.trustworthy * 100 + counts.unsure * 50
  return Math.round(weighted / total)
}

export function blendScores(editorialScore, communityScore) {
  if (editorialScore == null && communityScore == null) return null
  if (editorialScore == null) return communityScore
  if (communityScore == null) return editorialScore
  return Math.round((editorialScore + communityScore) / 2)
}

export async function getScoreForSite(siteId, editorialScore) {
  const counts = await votesRepo.getVoteCounts(siteId)
  const communityScore = computeCommunityScore(counts)
  const totalVotes = counts.trustworthy + counts.scam + counts.unsure
  const trustScore = blendScores(editorialScore, communityScore)
  return { counts, communityScore, trustScore, totalVotes }
}

export async function recordVote({ slug, vote, fingerprintRaw, ipRaw, userAgent }) {
  // Validate inputs
  if (!VOTE_VALUES.has(vote)) {
    const err = new Error('Invalid vote. Must be trustworthy, scam or unsure.')
    err.status = 400
    throw err
  }
  if (!fingerprintRaw || String(fingerprintRaw).length < 8) {
    const err = new Error('Missing or invalid fingerprint.')
    err.status = 400
    throw err
  }

  const site = await sitesRepo.findSiteIdBySlug(slug)
  if (!site) {
    const err = new Error('Site not found.')
    err.status = 404
    throw err
  }

  const fingerprint = hashFingerprint(fingerprintRaw)
  const ipHash = hashIp(ipRaw)

  await votesRepo.upsertVote({
    siteId: site.id,
    vote,
    fingerprint,
    ipHash,
    userAgent: String(userAgent || '').slice(0, 255),
  })

  // Recompute scores from the fresh DB state
  const { counts, communityScore, trustScore, totalVotes } =
    await getScoreForSite(site.id, site.trustScore)

  return {
    yourVote: vote,
    counts,
    communityScore,
    trustScore,
    totalVotes,
  }
}