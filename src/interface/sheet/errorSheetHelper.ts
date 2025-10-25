import { createRef } from 'react'
import type { BottomErrorSheetRef, ErrorSheetData } from './BottomErrorSheet'

// Global ref for the error sheet
export const errorSheetRef = createRef<BottomErrorSheetRef>()

// Helper function to show error sheet from anywhere
export const showErrorSheet = (data: ErrorSheetData) => {
  errorSheetRef.current?.show(data)
}

// Helper function to hide error sheet
export const hideErrorSheet = () => {
  errorSheetRef.current?.hide()
}
