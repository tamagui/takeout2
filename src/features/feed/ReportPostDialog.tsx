import { randomId } from '@take-out/helpers'
import { useState } from 'react'
import {
  Adapt,
  Dialog,
  Label,
  RadioGroup,
  Sheet,
  SizableText,
  XStack,
  YStack,
} from 'tamagui'

import { Button } from '~/interface/buttons/Button'
import { showError } from '~/interface/dialogs/actions'
import { showToast } from '~/interface/toast/helpers'
import { zero } from '~/zero/client'

interface ReportPostDialogProps {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'other', label: 'Other' },
]

export function ReportPostDialog({ postId, open, onOpenChange }: ReportPostDialogProps) {
  const [reportReason, setReportReason] = useState('inappropriate')
  const [reportDetails, setReportDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return

    const finalDetails = reportDetails.trim()

    setIsSubmitting(true)
    try {
      zero.mutate.report.reportPost({
        id: randomId(),
        createdAt: Date.now(),
        postId,
        reason: reportReason,
        details: finalDetails,
      })

      onOpenChange(false)
      setReportReason('inappropriate')
      setReportDetails('')

      showToast('Thanks for reporting', { type: 'success' })
      setIsSubmitting(false)
    } catch (error) {
      showError(error, 'Submit Report')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Adapt when="max-md" platform="touch">
        <Sheet transition="quickLessBouncy" modal dismissOnSnapToBottom snapPoints={[60]}>
          <Sheet.Container p="4">
            <Adapt.Contents />
          </Sheet.Container>
          <Sheet.Overlay
            bg="background"
            opacity="0.5 enter:0 exit:0"
            transition="quick"
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay key="overlay" transition="quick" opacity="0.5 enter:0 exit:0" />

        <Dialog.Content
          key="content"
          transition={{
            preset: 'quick',
            properties: 'transform, opacity',
            opacity: { preset: 'quick', spring: { overshootClamping: true } },
          }}
          x="enter:0 exit:0"
          y="enter:-20px exit:10px"
          opacity="enter:0 exit:0"
          scale="enter:0.9 exit:0.95"
          p="4"
          bg="color2"
          borderWidth={1}
          borderColor="border-color"
          elevate
        >
          <YStack gap="4" maxW={500}>
            <Dialog.Title size="6" fontWeight="600">
              Report Post
            </Dialog.Title>

            <YStack gap="3">
              <SizableText size="4" color="color11">
                Why are you reporting this post?
              </SizableText>

              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <YStack gap="3">
                  {REPORT_REASONS.map((reason) => (
                    <XStack key={reason.value} gap="3" items="center">
                      <RadioGroup.Item
                        value={reason.value}
                        id={`report-reason-${reason.value}`}
                        size="3"
                      >
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label
                        htmlFor={`report-reason-${reason.value}`}
                        flex={1}
                        color="color12"
                        size="4"
                      >
                        {reason.label}
                      </Label>
                    </XStack>
                  ))}
                </YStack>
              </RadioGroup>
            </YStack>

            <XStack gap="3" justify="flex-end">
              <Dialog.Close asChild>
                <Button bg="color3">Cancel</Button>
              </Dialog.Close>
              <Button
                onPress={handleSubmit}
                theme="accent"
                disabled={
                  isSubmitting || (reportReason === 'other' && !reportDetails.trim())
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
