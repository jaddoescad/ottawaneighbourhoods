export type FeedbackStatus = 'pending' | 'approved' | 'rejected'
export type FeedbackType = 'general' | 'neighbourhood'
export type ModeratorTag = 'implemented' | 'planned' | 'noted' | 'wont_fix' | null

export interface Feedback {
  id: string
  created_at: string
  updated_at: string
  author_name: string
  author_email: string | null
  content: string
  feedback_type: FeedbackType
  neighbourhood_id: string | null
  status: FeedbackStatus
  moderator_tag: ModeratorTag
  moderator_reply: string | null
  moderated_at: string | null
  upvotes: number
  downvotes: number
}

export interface FeedbackSubmission {
  author_name: string
  author_email?: string
  content: string
  feedback_type: FeedbackType
  neighbourhood_id?: string
}

export interface FeedbackModeration {
  status?: FeedbackStatus
  moderator_tag?: ModeratorTag
  moderator_reply?: string
}

export const TAG_LABELS: Record<Exclude<ModeratorTag, null>, string> = {
  implemented: 'Implemented',
  planned: 'Planned',
  noted: 'Noted',
  wont_fix: "Won't Fix",
}

export const TAG_COLORS: Record<Exclude<ModeratorTag, null>, string> = {
  implemented: 'bg-green-100 text-green-800',
  planned: 'bg-blue-100 text-blue-800',
  noted: 'bg-gray-100 text-gray-800',
  wont_fix: 'bg-red-100 text-red-800',
}
