import { useAuth } from '~/features/auth/client/authClient'
import { Link } from '~/interface/app/Link'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'
import { ListItem } from '~/interface/lists/ListItem'

export const LoginButton = ({ listItem }: { listItem?: boolean }) => {
  const { state } = useAuth()

  const text = state === 'logged-in' ? 'Account' : 'Login'

  return (
    <Link href={state === 'logged-in' ? '/home' : '/login'}>
      {listItem ? (
        <ListItem>
          <ListItem.Icon>
            <UserIcon />
          </ListItem.Icon>
          <ListItem.Text>{text}</ListItem.Text>
        </ListItem>
      ) : (
        <ButtonSimple>{state === 'logged-in' ? 'Account' : 'Login'}</ButtonSimple>
      )}
    </Link>
  )
}
