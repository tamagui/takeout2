# Tamagui UI Framework

This guide covers the Tamagui configuration and usage patterns in this project.

## Tamagui v4 Configuration

This project uses @tamagui/config v4 with specific shorthand props. These are
the only shorthands available in v4 (changed from v3 which had more extensive
shorthands).

### Available Shorthands in v4

Text properties:

- text → textAlign

View/Layout properties:

- b → bottom
- bg → backgroundColor
- content → alignContent
- grow → flexGrow
- items → alignItems
- justify → justifyContent
- l → left
- m → margin
- maxH → maxHeight
- maxW → maxWidth
- mb → marginBottom
- minH → minHeight
- minW → minWidth
- ml → marginLeft
- mr → marginRight
- mt → marginTop
- mx → marginHorizontal
- my → marginVertical
- p → padding
- pb → paddingBottom
- pl → paddingLeft
- pr → paddingRight
- pt → paddingTop
- px → paddingHorizontal
- py → paddingVertical
- r → right
- rounded → borderRadius
- select → userSelect
- self → alignSelf
- shrink → flexShrink
- t → top
- z → zIndex

Many shorthands from v3 (like w for width, h for height, f for flex, etc.) are
no longer available in v4. Use the full property names for any properties not
listed above.

## Component Preferences

When building UI components, prefer these project-specific implementations:

- Buttons: Use ButtonSimple from the project instead of Tamagui's Button
- Images: Use @tamagui/image-next for Next.js compatibility
- Select/Dropdown: Use the custom Select component from src/interface
- Tabs: Use the custom Tabs component from src/interface
- Popover: Use the custom Popover component from src/interface

## Best Practices

Use full property names for any properties not in the v4 shorthand list. Check
existing components for patterns before creating new ones. Follow the project's
component hierarchy - prefer project components over Tamagui defaults. Maintain
consistency with existing UI patterns in the codebase.
