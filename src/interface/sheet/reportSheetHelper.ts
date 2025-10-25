import { createRef } from 'react'
import type { ReportSheetRef } from './ReportSheet'

export const reportSheetRef = createRef<ReportSheetRef>()

export const showReportForPost = (postId: string) => {
  reportSheetRef.current?.showForPost(postId)
}

export const showReportForUser = (userId: string, username?: string) => {
  reportSheetRef.current?.showForUser(userId, username)
}

export const hideReportSheet = () => {
  reportSheetRef.current?.hide()
}
