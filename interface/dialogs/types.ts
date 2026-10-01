export type DialogClosedType = {
  type: 'closed'
}

export type DialogCreatePostType = {
  type: 'create-post'
}

export type DialogType = DialogClosedType | DialogCreatePostType
