// import { useForm } from '@tanstack/react-form'
// import { memo } from 'react'
// import { Input, Spacer } from 'tamagui'
// import { PaneFooter } from '~/features/topbar/TopBarPane'
// import { topBarSlidingPopoverController } from '~/features/topbar/TopBarSlidingPopover'
// import { Link } from '~/interface/app/Link'
// import { ButtonAction } from '~/interface/buttons/ButtonAction'
// import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
// import { getValidationState } from '~/interface/forms/getValidationState'
// import { LabeledGroup } from '~/interface/forms/LabeledGroup'
// import { showToast } from '~/interface/toast/Toast'
// import { AvatarUpload } from '~/interface/upload/AvatarUpload'
// import { zero } from '~/zero'
// import { getUserProfileLink } from '../getUserProfileLink'
// import { useUser } from '../useUser'

// export const UserProfileEditForm = memo(
//   ({
//     isOpen,
//     onProfileComplete,
//   }: {
//     isOpen: boolean
//     onProfileComplete?: () => void
//   }) => {
//     const { user } = useUser()

//     const form = useForm({
//       defaultValues: {
//         name: user?.name || '',
//         username: user?.username || '',
//         image: user?.image || '',
//       },
//       onSubmit: async ({ value }) => {
//         if (!value.image) {
//           showToast('Profile image is required')
//           return
//         }

//         try {
//           await zero.mutate.user.updateProfile({
//             name: value.name,
//             image: value.image,
//             username: value.username,
//           }).server

//           showToast('Saved')
//           onProfileComplete?.()
//         } catch (error) {
//           showToast('Failed to save changes')
//           console.error('Failed to update user:', error)
//         }
//       },
//     })

//     return (
//       <>
//         <form.Field
//           name="name"
//           validators={{
//             onChange: ({ value }) => {
//               if (!value) return 'Name is required'
//             },
//           }}
//         >
//           {(field) => (
//             <LabeledGroup
//               validation={getValidationState(field)}
//               disableValidCheck
//               label="Name"
//               htmlFor="user-name"
//             >
//               <Input
//                 maxW={200}
//                 value={field.state.value}
//                 onChange={(e: any) => field.handleChange(e.target.value)}
//                 onBlur={field.handleBlur}
//                 flex={1}
//                 id="user-name"
//                 onSubmitEditing={() => form.handleSubmit()}
//               />
//             </LabeledGroup>
//           )}
//         </form.Field>

//         <form.Field
//           name="username"
//           validators={{
//             onChange: ({ value }) => {
//               if (!value) return 'required'
//               if (value.length < 3) return '>=3 characters'
//             },
//           }}
//         >
//           {(field) => (
//             <LabeledGroup
//               validation={getValidationState(field)}
//               disableValidCheck
//               label="Username"
//               htmlFor="user-username"
//             >
//               <Input
//                 maxW={200}
//                 textContentType="username"
//                 autoComplete="off"
//                 value={field.state.value}
//                 onChange={(e: any) => field.handleChange(e.target.value)}
//                 onBlur={field.handleBlur}
//                 flex={1}
//                 id="user-username"
//                 onSubmitEditing={() => form.handleSubmit()}
//               />
//             </LabeledGroup>
//           )}
//         </form.Field>

//         <form.Field
//           name="image"
//           validators={{
//             onChange: ({ value }) => {
//               if (!value) return 'required'
//             },
//           }}
//         >
//           {(field) => (
//             <LabeledGroup
//               validation={getValidationState(field)}
//               disableValidCheck
//               label="Image"
//               htmlFor="image"
//             >
//               <AvatarUpload
//                 id="useredit-image"
//                 dropActive={isOpen}
//                 defaultImage={field.state.value}
//                 onChangeImage={(newImage) => {
//                   field.handleChange(newImage)
//                 }}
//               />
//             </LabeledGroup>
//           )}
//         </form.Field>

//         <Spacer flex />

//         <PaneFooter>
//           {!!user && (
//             <Link
//               href={getUserProfileLink(user)}
//               onPressOut={() => {
//                 topBarSlidingPopoverController.emit({ type: 'close' })
//               }}
//             >
//               <ButtonSimple size="small">Profile</ButtonSimple>
//             </Link>
//           )}

//           <Spacer flex />

//           <form.Subscribe>
//             {(state) => {
//               const disabled = !state.isValid || state.isSubmitting
//               return (
//                 <ButtonAction
//                   data-testid="profile-save"
//                   size="small"
//                   self="flex-end"
//                   opacity={disabled ? 0.5 : 1}
//                   disabled={disabled}
//                   onPress={() => form.handleSubmit()}
//                 >
//                   {state.isSubmitting ? '...' : 'Save'}
//                 </ButtonAction>
//               )
//             }}
//           </form.Subscribe>
//         </PaneFooter>
//       </>
//     )
//   }
// )
