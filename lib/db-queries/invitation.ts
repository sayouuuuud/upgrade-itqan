/**
 * Invitation Database Queries
 * Handles user invitations and sign-up flows
 * Fixed to match actual DB schema and uppercase status constraints.
 */

import { query, queryOne } from "../db"
import type { Invitation } from "../types/lms"
import crypto from "crypto"

export async function createInvitation(
  email: string,
  role: "STUDENT" | "TEACHER" | "PARENT",
  createdBy: string,
  parentEmail?: string // Note: parentEmail is not in the invitations table schema found, but we'll keep the param
): Promise<Invitation | null> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Using actual column names: email, token, status, expires_at, invited_by, role_to_assign
  return queryOne<Invitation>(
    `INSERT INTO invitations (token, email, role_to_assign, invited_by, expires_at, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())
     RETURNING *`,
    [token, email.toLowerCase(), role.toUpperCase(), createdBy, expiresAt]
  )
}

export async function validateInvitation(token: string): Promise<Invitation | null> {
  return queryOne<Invitation>(
    `SELECT * FROM invitations 
     WHERE token = $1 AND status = 'PENDING' AND expires_at > NOW()`,
    [token]
  )
}

export async function useInvitation(token: string, userId: string): Promise<boolean> {
  // Status 'ACCEPTED' matches the DB constraint
  const result = await query(
    `UPDATE invitations SET status = 'ACCEPTED', accepted_by_user_id = $1, accepted_at = CURRENT_TIMESTAMP 
     WHERE token = $2`,
    [userId, token]
  )
  return result.length > 0
}

export async function revokeInvitation(invitationId: string): Promise<boolean> {
  // Status 'CANCELLED' matches the DB constraint
  const result = await query(
    `UPDATE invitations SET status = 'CANCELLED' WHERE id = $1`,
    [invitationId]
  )
  return result.length > 0
}

export async function getInvitationsByCreator(userId: string): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE invited_by = $1 ORDER BY created_at DESC`,
    [userId]
  )
}

export async function getPendingInvitations(): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE status = 'PENDING' AND expires_at > NOW() ORDER BY created_at DESC`
  )
}

export async function getExpiredInvitations(): Promise<Invitation[]> {
  return query<Invitation>(
    `SELECT * FROM invitations WHERE status = 'PENDING' AND expires_at <= NOW() ORDER BY expires_at DESC`
  )
}

export async function cleanupExpiredInvitations(): Promise<number> {
  const result = await query(
    `UPDATE invitations SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at <= NOW()`
  )
  return result.length
}
