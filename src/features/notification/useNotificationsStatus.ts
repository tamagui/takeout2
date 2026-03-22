// web stub — notification permissions only apply on native
export const useNotificationStatus = () => ({
  isToggleActive: false,
  setIsToggleActive: (_: boolean) => {},
  handleToggle: async () => {},
  checkNotificationPermissions: async () => {},
})
