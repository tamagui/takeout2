import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { ListItem, type ListItemProps } from '~/interface/lists/ListItem'

export const LoginListItem = (props: ListItemProps) => {
  const { loginText, loginLink } = useAuth()

  return (
    <Link href={loginLink}>
      <ListItem {...props}>
        <ListItem.Icon>
          <UserIcon />
        </ListItem.Icon>
        <ListItem.Text>{loginText}</ListItem.Text>
      </ListItem>
    </Link>
  )
}
