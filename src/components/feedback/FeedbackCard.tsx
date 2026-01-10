import type { Feedback, ModeratorTag } from '@/lib/types/feedback'
import { TAG_LABELS, TAG_COLORS } from '@/lib/types/feedback'

interface FeedbackCardProps {
  feedback: Feedback
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function TagBadge({ tag }: { tag: Exclude<ModeratorTag, null> }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[tag]}`}>
      {TAG_LABELS[tag]}
    </span>
  )
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{feedback.author_name}</span>
            <span className="text-gray-400 text-sm">{formatDate(feedback.created_at)}</span>
            {feedback.moderator_tag && <TagBadge tag={feedback.moderator_tag} />}
          </div>
          <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">{feedback.content}</p>
        </div>
      </div>

      {feedback.moderator_reply && (
        <div className="mt-3 pl-4 border-l-2 border-blue-300 bg-blue-50 rounded-r-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">Response from OttawaHoods</p>
          <p className="text-sm text-blue-900">{feedback.moderator_reply}</p>
        </div>
      )}
    </div>
  )
}
