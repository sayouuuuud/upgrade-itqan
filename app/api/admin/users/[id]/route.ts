import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
        if (!session || !allowedRoles.includes(session.role as any)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: userId } = await params

        const user = await db.queryOne<any>(
            `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.bio, u.is_active, u.created_at, u.last_login_at,
             EXISTS(
                SELECT 1 FROM user_sessions us 
                WHERE us.user_id = u.id 
                AND us.last_active_at > NOW() - INTERVAL '5 minutes'
             ) as is_online,
             rp.full_name_triple, rp.city, rp.qualification, rp.memorized_parts,
             rp.years_of_experience, rp.certificate_file_url, rp.specialization, rp.about_me,
             u.has_quran_access, u.has_academy_access, u.platform_preference
             FROM users u
             LEFT JOIN reader_profiles rp ON rp.user_id = u.id
             WHERE u.id = $1`,
            [userId]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Access Control for Supervisors
        if (session.role === 'student_supervisor' && user.role !== 'student' && user.id !== session.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        if (session.role === 'reciter_supervisor' && user.role !== 'reader' && user.id !== session.sub) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Fetch history based on user role
        let history: any[] = []
        if (user.role === 'student') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   reader.name as evaluator_name
                 FROM recitations r
                 LEFT JOIN users reader ON reader.id = r.assigned_reader_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.student_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        } else if (user.role === 'reader') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   student.name as student_name
                 FROM recitations r
                 JOIN users student ON student.id = r.student_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.assigned_reader_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        }

        // 2. Recitation Metrics
        const dailyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'1 day\'',
            [userId]
        )
        const weeklyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
            [userId]
        )
        const monthlyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
            [userId]
        )

        // 3. Session Statistics (Bookings)
        // Completed Sessions
        const completedSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'completed\'',
            [userId]
        )
        // Absences / No-Shows
        const noShows = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'no_show\'',
            [userId]
        )
        // Cancelled Sessions
        const cancelledSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'cancelled\'',
            [userId]
        )

        // 4. Ratings (if user is a reader)
        let averageRating = 0
        if (user.role === 'reader') {
            const ratingRes = await db.queryOne<any>(
                'SELECT AVG(rating) as avg FROM reader_ratings WHERE reader_id = $1',
                [userId]
            )
            averageRating = parseFloat(ratingRes?.avg || "0")
        }

        // 5. Last tech session Info - fetch from activity_logs (login_success)
        const lastSession = await db.queryOne<any>(
            `SELECT ip_address, user_agent, created_at as last_active_at 
             FROM activity_logs 
             WHERE user_id = $1 AND action = 'login_success' 
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        )

        // 6. Fetch Country from page_views
        const countryRes = await db.queryOne<any>(
            'SELECT country FROM page_views WHERE user_id = $1 AND country IS NOT NULL ORDER BY created_at DESC LIMIT 1',
            [userId]
        )

        // 6b. Fetch Errors Log if student
        let errorsLog: any[] = []
        if (user.role === 'student') {
            errorsLog = await db.query<any>(
                `SELECT r.id as recitation_id, r.surah_name, rev.error_markers, rev.detailed_feedback, rev.created_at
               FROM reviews rev
               JOIN recitations r ON r.id = rev.recitation_id
               WHERE r.student_id = $1 AND (rev.error_markers IS NOT NULL AND rev.error_markers != '[]'::jsonb)
               ORDER BY rev.created_at DESC`,
                [userId]
            )
        }

        // 7. Activity Data (Last 14 days)
        const activityData = await db.query<any>(
            `SELECT 
                TO_CHAR(d, 'YYYY-MM-DD') as date,
                COUNT(r.id) as count
             FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') d
             LEFT JOIN recitations r ON DATE(r.created_at) = d AND r.student_id = $1
             GROUP BY d
             ORDER BY d ASC`,
            [userId]
        )

        return NextResponse.json({
            user,
            metrics: {
                recitations: {
                    daily: parseInt(dailyRec?.count || "0") || 0,
                    weekly: parseInt(weeklyRec?.count || "0") || 0,
                    monthly: parseInt(monthlyRec?.count || "0") || 0
                },
                sessions: {
                    completed: parseInt(completedSessions?.count || "0") || 0,
                    noShow: parseInt(noShows?.count || "0") || 0,
                    cancelled: parseInt(cancelledSessions?.count || "0") || 0
                },
                rating: averageRating || 0
            },
            history: history || [],
            lastSession: lastSession || null,
            country: countryRes?.country || null,
            activityData: activityData || [],
            errorsLog: errorsLog || []
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id: userId } = await params

        // Get user info before deletion for logging
        const user = await db.queryOne<any>('SELECT name, role FROM users WHERE id = $1', [userId])
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Helper: run query and ignore "table does not exist" errors so this is robust
        const safe = async (sql: string, params: any[] = []) => {
            try {
                await db.query(sql, params)
            } catch (e: any) {
                // 42P01 = undefined_table, 42703 = undefined_column. Ignore those so a
                // missing optional table never blocks deletion.
                if (e?.code === '42P01' || e?.code === '42703') return
                throw e
            }
        }

        // ============================================================
        // 1) Null-out non-critical references (SET NULL semantics)
        // ============================================================
        await safe('UPDATE conversations SET assigned_supervisor_id = NULL WHERE assigned_supervisor_id = $1', [userId])
        await safe('UPDATE conversations SET admin_id = NULL WHERE admin_id = $1', [userId])
        await safe('UPDATE academy_teachers SET verified_by = NULL WHERE verified_by = $1', [userId])
        await safe('UPDATE teacher_applications SET reviewed_by = NULL WHERE reviewed_by = $1', [userId])
        await safe('UPDATE reader_applications SET reviewer_id = NULL WHERE reviewer_id = $1', [userId])
        await safe('UPDATE lessons SET reviewed_by = NULL WHERE reviewed_by = $1', [userId])
        await safe('UPDATE lessons SET submitted_by = NULL WHERE submitted_by = $1', [userId])
        await safe('UPDATE categories SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE learning_paths SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE competitions SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE competitions SET winner_id = NULL WHERE winner_id = $1', [userId])
        await safe('UPDATE competition_entries SET evaluated_by = NULL WHERE evaluated_by = $1', [userId])
        await safe('UPDATE invitations SET invited_by = NULL WHERE invited_by = $1', [userId])
        await safe('UPDATE invitations SET accepted_by_user_id = NULL WHERE accepted_by_user_id = $1', [userId])
        await safe('UPDATE invitation_codes SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE invitation_history SET changed_by = NULL WHERE changed_by = $1', [userId])
        await safe('UPDATE announcements SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE forum_posts SET last_reply_by = NULL WHERE last_reply_by = $1', [userId])
        await safe('UPDATE fiqh_questions SET answered_by = NULL WHERE answered_by = $1', [userId])
        await safe('UPDATE academy_certificates SET issued_by = NULL WHERE issued_by = $1', [userId])
        await safe('UPDATE bookings SET cancelled_by = NULL WHERE cancelled_by = $1', [userId])
        await safe('UPDATE users SET role_changed_by = NULL WHERE role_changed_by = $1', [userId])
        await safe('UPDATE users SET created_by = NULL WHERE created_by = $1', [userId])
        await safe('UPDATE system_settings SET updated_by = NULL WHERE updated_by = $1', [userId])

        // ============================================================
        // 2) Delete records that belong to / are owned by this user
        // ============================================================

        // --- Mokraa side ---
        await safe('DELETE FROM word_mistakes WHERE student_id = $1 OR reader_id = $1', [userId])
        await safe('DELETE FROM recitation_feedback WHERE reader_id = $1', [userId])
        await safe('DELETE FROM reviews WHERE reader_id = $1', [userId])
        await safe('DELETE FROM reader_ratings WHERE student_id = $1 OR reader_id = $1', [userId])
        await safe('DELETE FROM reader_time_off WHERE reader_id = $1', [userId])
        await safe('DELETE FROM reader_stats WHERE reader_id = $1', [userId])
        await safe('DELETE FROM availability_slots WHERE reader_id = $1', [userId])
        await safe('DELETE FROM reserved_slots WHERE student_id = $1 OR reader_id = $1', [userId])
        await safe('DELETE FROM booking_reschedule_requests WHERE requested_by = $1', [userId])
        await safe('DELETE FROM booking_comments WHERE user_id = $1', [userId])
        await safe('DELETE FROM bookings WHERE student_id = $1 OR reader_id = $1', [userId])
        await safe('DELETE FROM recitations WHERE student_id = $1 OR assigned_reader_id = $1', [userId])
        await safe('DELETE FROM reader_profiles WHERE user_id = $1', [userId])
        await safe('DELETE FROM reader_applications WHERE user_id = $1', [userId])
        await safe('DELETE FROM student_stats WHERE student_id = $1', [userId])
        await safe('DELETE FROM certificate_data WHERE student_id = $1', [userId])
        await safe('DELETE FROM messages WHERE sender_id = $1 OR recipient_id = $1', [userId])
        await safe('DELETE FROM conversations WHERE student_id = $1 OR reader_id = $1', [userId])

        // --- Academy side ---
        await safe('DELETE FROM academy_messages WHERE sender_id = $1', [userId])
        await safe('DELETE FROM academy_messages WHERE conversation_id IN (SELECT id FROM academy_conversations WHERE teacher_id = $1 OR student_id = $1)', [userId])
        await safe('DELETE FROM academy_conversations WHERE teacher_id = $1 OR student_id = $1', [userId])
        await safe('DELETE FROM academy_certificates WHERE student_id = $1', [userId])
        await safe('DELETE FROM session_attendance WHERE student_id = $1', [userId])
        await safe('DELETE FROM session_attendance WHERE session_id IN (SELECT id FROM course_sessions WHERE teacher_id = $1)', [userId])
        await safe('DELETE FROM course_sessions WHERE teacher_id = $1', [userId])
        await safe('DELETE FROM task_submissions WHERE student_id = $1', [userId])
        await safe('DELETE FROM task_submissions WHERE task_id IN (SELECT id FROM tasks WHERE assigned_by = $1 OR assigned_to = $1)', [userId])
        await safe('DELETE FROM tasks WHERE assigned_by = $1 OR assigned_to = $1', [userId])
        await safe('DELETE FROM lesson_progress WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id = $1)', [userId])
        await safe('DELETE FROM enrollments WHERE student_id = $1', [userId])
        await safe('DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)', [userId])
        await safe('DELETE FROM lesson_attachments WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1))', [userId])
        await safe('DELETE FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)', [userId])
        await safe('DELETE FROM learning_path_courses WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)', [userId])
        await safe('DELETE FROM public_lesson_subscribers WHERE teacher_id = $1', [userId])
        await safe('DELETE FROM courses WHERE teacher_id = $1', [userId])
        await safe('DELETE FROM halaqat WHERE teacher_id = $1', [userId])
        await safe('UPDATE users SET halaqah_id = NULL WHERE halaqah_id IN (SELECT id FROM halaqat WHERE teacher_id = $1)', [userId])
        await safe('DELETE FROM teacher_verifications WHERE teacher_id = $1 OR supervisor_id = $1', [userId])
        await safe('DELETE FROM academy_teachers WHERE user_id = $1', [userId])
        await safe('DELETE FROM teacher_applications WHERE user_id = $1', [userId])

        // --- Parent / student links ---
        await safe('DELETE FROM parent_student_link_audit WHERE performed_by = $1', [userId])
        await safe('DELETE FROM parent_student_link_audit WHERE parent_student_link_id IN (SELECT id FROM parent_student_links WHERE parent_id = $1 OR student_id = $1)', [userId])
        await safe('DELETE FROM parent_student_links WHERE parent_id = $1 OR student_id = $1', [userId])
        await safe('DELETE FROM parent_children WHERE parent_id = $1 OR child_id = $1', [userId])
        await safe('DELETE FROM parent_child_links WHERE parent_id = $1 OR child_id = $1', [userId])

        // --- Forum / Fiqh / Community ---
        await safe('DELETE FROM forum_replies WHERE author_id = $1', [userId])
        await safe('DELETE FROM forum_replies WHERE post_id IN (SELECT id FROM forum_posts WHERE author_id = $1)', [userId])
        await safe('DELETE FROM forum_posts WHERE author_id = $1', [userId])
        await safe('DELETE FROM fiqh_questions WHERE asked_by = $1', [userId])

        // --- Gamification / progress ---
        await safe('DELETE FROM points_log WHERE user_id = $1', [userId])
        await safe('DELETE FROM user_points WHERE user_id = $1', [userId])
        await safe('DELETE FROM badges WHERE user_id = $1', [userId])
        await safe('DELETE FROM memorization_log WHERE student_id = $1', [userId])
        await safe('DELETE FROM student_path_progress WHERE student_id = $1', [userId])
        await safe('DELETE FROM competition_entries WHERE student_id = $1', [userId])

        // --- Supervisor / permissions / sessions ---
        await safe('DELETE FROM supervisor_assignments WHERE supervisor_id = $1 OR assigned_by = $1', [userId])
        await safe('DELETE FROM permission_invalidations WHERE user_id = $1 OR admin_id = $1', [userId])

        // --- Notifications / activity / sessions / auth ---
        await safe('DELETE FROM notifications WHERE user_id = $1 OR related_user_id = $1', [userId])
        await safe('DELETE FROM activity_logs WHERE user_id = $1', [userId])
        await safe('DELETE FROM user_sessions WHERE user_id = $1', [userId])
        await safe('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
        await safe('DELETE FROM page_views WHERE user_id = $1', [userId])
        await safe('DELETE FROM report_exports WHERE user_id = $1', [userId])
        await safe('DELETE FROM "session" WHERE "userId" = $1', [userId])
        await safe('DELETE FROM "account" WHERE "userId" = $1', [userId])

        // ============================================================
        // 3) Finally delete the user
        // ============================================================
        await db.query('DELETE FROM users WHERE id = $1', [userId])

        // Log admin action
        await safe(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [session.sub, 'permanent_delete_user', 'user', userId, `Admin permanently deleted ${user.role} ${user.name}`]
        )

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[v0] Delete user error:', err?.message, err?.code, err?.detail)
        return NextResponse.json({
            error: 'Internal Server Error',
            detail: err?.detail || err?.message || 'Unknown error'
        }, { status: 500 })
    }
}
