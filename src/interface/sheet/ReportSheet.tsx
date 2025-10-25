import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Label, RadioGroup, SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Sheet, type SheetRef } from '~/interface/sheet/Sheet'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'

export interface ReportSheetRef {
  showForPost: (postId: string) => void
  showForUser: (userId: string, username?: string) => void
  hide: () => void
}

type ReportTarget =
  | { type: 'post'; id: string }
  | { type: 'user'; id: string; username?: string }

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'other', label: 'Other' },
]

export const ReportSheet = forwardRef<ReportSheetRef>((_, ref) => {
  const sheetRef = useRef<SheetRef>(null)
  const [target, setTarget] = useState<ReportTarget | null>(null)
  const [reportReason, setReportReason] = useState('inappropriate')
  const [reportDetails, setReportDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    showForPost: (postId: string) => {
      setTarget({ type: 'post', id: postId })
      setReportReason('inappropriate')
      setReportDetails('')
      sheetRef.current?.expand()
    },
    showForUser: (userId: string, username?: string) => {
      setTarget({ type: 'user', id: userId, username })
      setReportReason('inappropriate')
      setReportDetails('')
      sheetRef.current?.expand()
    },
    hide: () => {
      sheetRef.current?.collapse()
    },
  }))

  const handleSubmit = async () => {
    if (!target || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Always include details if provided, but require them for "other"
      const finalDetails = reportDetails.trim()

      if (target.type === 'post') {
        zero.mutate.report.reportPost({
          postId: target.id,
          reason: reportReason,
          details: finalDetails,
        })
      } else if (target.type === 'user') {
        zero.mutate.report.reportUser({
          userId: target.id,
          reason: reportReason,
          details: finalDetails,
        })
      }

      sheetRef.current?.collapse()
      setTarget(null)
      setReportReason('inappropriate')
      setReportDetails('')

      const successMessage = 'Thanks for reporting'

      showToast(successMessage, { type: 'success' })
    } catch (error) {
      showToast('Failed to submit report. Please try again.', { type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title =
    target?.type === 'post'
      ? 'Report Post'
      : target?.type === 'user'
        ? `Report ${target.username ? `@${target.username}` : 'User'}`
        : 'Report'

  return (
    <Sheet ref={sheetRef} title={title} snapPoints={['90%']}>
      <SizableText size="$4" color="$color11">
        Why are you reporting this {target?.type || 'content'}?
      </SizableText>

      <RadioGroup value={reportReason} onValueChange={setReportReason}>
        {REPORT_REASONS.map((reason) => (
          <XStack key={reason.value} gap="$3" items="center">
            <RadioGroup.Item
              value={reason.value}
              id={`report-reason-${reason.value}`}
              size="$3"
            >
              <RadioGroup.Indicator />
            </RadioGroup.Item>
            <Label
              htmlFor={`report-reason-${reason.value}`}
              flex={1}
              size="$4"
              color="$color12"
            >
              {reason.label}
            </Label>
          </XStack>
        ))}
      </RadioGroup>

      <YStack gap="$2">
        <Label htmlFor="report-details-input" size="$3" color="$color11">
          Additional Details (Optional)
        </Label>
        <View
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          bg="$color2"
          minH={100}
        >
          <BottomSheetTextInput
            style={[styles.textInput, { color: theme.color12.val }]}
            value={reportDetails}
            onChangeText={setReportDetails}
            placeholder={
              reportReason === 'other'
                ? "Please provide details about why you're reporting this..."
                : 'Add any additional context (optional)...'
            }
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
        <SizableText size="$1" color="$color10" text="right">
          {reportDetails.length}/500
        </SizableText>
      </YStack>

      <XStack gap="$3" mt="auto">
        <ButtonSimple flex={1} onPress={() => sheetRef.current?.collapse()} bg="$color3">
          Cancel
        </ButtonSimple>
        <ButtonSimple
          flex={1}
          onPress={handleSubmit}
          theme="accent"
          disabled={isSubmitting || (reportReason === 'other' && !reportDetails.trim())}
          opacity={
            isSubmitting || (reportReason === 'other' && !reportDetails.trim()) ? 0.5 : 1
          }
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </ButtonSimple>
      </XStack>
    </Sheet>
  )
})

const styles = StyleSheet.create({
  textInput: {
    padding: 12,
    fontSize: 14,
    height: 60,
  },
})
