#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`AWS IAM Identity Center user management`
  .args(
    '--email string --name string --display-name string --profile string --permission-set string --dry-run boolean'
  )
  .run(async ({ args, $ }) => {
    // configuration
    const SSO_REGION = 'us-west-1'
    const DEFAULT_SESSION_DURATION = 'PT12H'

    const AVAILABLE_PROFILES = {
      prod: 'tamagui-prod',
      production: 'tamagui-prod',
      dev: 'tamagui-dev',
      development: 'tamagui-dev',
    } as const

    const {
      email,
      name,
      displayName,
      profile = 'prod',
      permissionSet = 'AdministratorAccess',
      dryRun,
      rest,
    } = args

    const command = rest[0]

    // helper functions
    async function getIdentityStoreId(profile: string) {
      const result =
        await $`aws --profile ${profile} --region ${SSO_REGION} sso-admin list-instances --query 'Instances[0].IdentityStoreId' --output text`.text()
      return result.trim()
    }

    async function getInstanceArn(profile: string) {
      const result =
        await $`aws --profile ${profile} --region ${SSO_REGION} sso-admin list-instances --query 'Instances[0].InstanceArn' --output text`.text()
      return result.trim()
    }

    async function getAccountId(profile: string) {
      const result =
        await $`aws --profile ${profile} sts get-caller-identity --query 'Account' --output text`.text()
      return result.trim()
    }

    async function getUserId(email: string, profile: string) {
      const identityStoreId = await getIdentityStoreId(profile)

      try {
        const result =
          await $`aws --profile ${profile} --region ${SSO_REGION} identitystore get-user-id --identity-store-id ${identityStoreId} --alternate-identifier '{"UniqueAttribute":{"AttributePath":"emails.value","AttributeValue":"${email}"}}' --query 'UserId' --output text`.text()
        return result.trim()
      } catch {
        return null
      }
    }

    async function getPermissionSetArn(name: string, profile: string) {
      const instanceArn = await getInstanceArn(profile)
      const permissionSets =
        await $`aws --profile ${profile} --region ${SSO_REGION} sso-admin list-permission-sets --instance-arn ${instanceArn} --query 'PermissionSets' --output json`.json()

      for (const arn of permissionSets) {
        const setName = await getPermissionSetName(arn, profile)
        if (setName === name) {
          return arn
        }
      }

      return null
    }

    async function getPermissionSetName(arn: string, profile: string) {
      const instanceArn = await getInstanceArn(profile)
      const result =
        await $`aws --profile ${profile} --region ${SSO_REGION} sso-admin describe-permission-set --instance-arn ${instanceArn} --permission-set-arn ${arn} --query 'PermissionSet.Name' --output text`.text()
      return result.trim()
    }

    async function listUsers() {
      const awsProfile = AVAILABLE_PROFILES[profile as keyof typeof AVAILABLE_PROFILES]

      if (!awsProfile) {
        console.error(
          `❌ Invalid profile: ${profile}. Use: ${Object.keys(AVAILABLE_PROFILES).join(', ')}`
        )
        process.exit(1)
      }

      console.info(`📋 Listing users for ${awsProfile}...\n`)

      const identityStoreId = await getIdentityStoreId(awsProfile)
      const result =
        await $`aws --profile ${awsProfile} --region ${SSO_REGION} identitystore list-users --identity-store-id ${identityStoreId} --query 'Users[*].[UserId,UserName,DisplayName,Emails[0].Value]' --output json`.json()

      if (result.length === 0) {
        console.info('No users found')
        return
      }

      console.info('Users:')
      for (const [userId, userName, displayName, email] of result) {
        console.info(`  • ${displayName || userName} (${email}) - ID: ${userId}`)
      }
    }

    async function addUser() {
      const awsProfile = AVAILABLE_PROFILES[profile as keyof typeof AVAILABLE_PROFILES]

      if (!awsProfile) {
        console.error(
          `❌ Invalid profile: ${profile}. Use: ${Object.keys(AVAILABLE_PROFILES).join(', ')}`
        )
        process.exit(1)
      }

      if (!email || !name) {
        console.error('❌ Required: --email, --name')
        process.exit(1)
      }

      const userDisplayName = displayName || name

      // parse name into first and last name
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || firstName

      console.info(`🚀 Adding user: ${userDisplayName} (${email}) to ${awsProfile}`)

      const identityStoreId = await getIdentityStoreId(awsProfile)
      const instanceArn = await getInstanceArn(awsProfile)
      const accountId = await getAccountId(awsProfile)

      // check if user already exists
      let userId = await getUserId(email, awsProfile)

      if (userId) {
        console.info('  ℹ️  User already exists')
      } else {
        // create user
        console.info('  Creating user in IAM Identity Center...')

        if (!dryRun) {
          const result =
            await $`aws --profile ${awsProfile} --region ${SSO_REGION} identitystore create-user --identity-store-id ${identityStoreId} --user-name ${email} --display-name "${userDisplayName}" --name '{"GivenName":"${firstName}","FamilyName":"${lastName}"}' --emails '[{"Value":"${email}","Primary":true}]' --query 'UserId' --output text`.text()
          userId = result.trim()
          console.info(`  ✓ User created with ID: ${userId}`)
        } else {
          console.info('  [dry-run] Would create user')
          userId = 'dry-run-user-id'
        }
      }

      // get permission set
      const permissionSetName = permissionSet || 'AdministratorAccess'
      let permissionSetArn = await getPermissionSetArn(permissionSetName, awsProfile)

      if (!permissionSetArn) {
        console.error(`❌ Permission set '${permissionSetName}' not found`)
        process.exit(1)
      }

      // assign to account
      console.info(`  Assigning to ${awsProfile} account...`)

      if (!dryRun) {
        try {
          await $`aws --profile ${awsProfile} --region ${SSO_REGION} sso-admin create-account-assignment --instance-arn ${instanceArn} --target-id ${accountId} --target-type AWS_ACCOUNT --permission-set-arn ${permissionSetArn} --principal-type USER --principal-id ${userId}`.quiet()
          console.info(`  ✓ Assigned to ${awsProfile}`)
        } catch (error) {
          const errorMessage = (error as any).toString()
          if (errorMessage.includes('ConflictException')) {
            console.info(`  ℹ️  Already assigned to ${awsProfile}`)
          } else {
            console.error(`  ❌ Failed to assign to ${awsProfile}: ${error}`)
          }
        }
      } else {
        console.info(`  [dry-run] Would assign to ${awsProfile}`)
      }

      console.info('\n✅ User setup complete!')
      console.info('\nThe user will receive an email to set up their password.')
      console.info('They can then access AWS via your SSO portal.')
    }

    async function removeUser() {
      const awsProfile = AVAILABLE_PROFILES[profile as keyof typeof AVAILABLE_PROFILES]

      if (!awsProfile) {
        console.error(
          `❌ Invalid profile: ${profile}. Use: ${Object.keys(AVAILABLE_PROFILES).join(', ')}`
        )
        process.exit(1)
      }

      if (!email) {
        console.error('❌ Required: --email')
        process.exit(1)
      }

      console.info(`🗑️  Removing user: ${email} from ${awsProfile}`)

      const identityStoreId = await getIdentityStoreId(awsProfile)
      const instanceArn = await getInstanceArn(awsProfile)
      const accountId = await getAccountId(awsProfile)
      const userId = await getUserId(email, awsProfile)

      if (!userId) {
        console.error('❌ User not found')
        process.exit(1)
      }

      // remove account assignments
      console.info('  Removing account assignments...')

      try {
        const assignments =
          await $`aws --profile ${awsProfile} --region ${SSO_REGION} sso-admin list-account-assignments-for-principal --instance-arn ${instanceArn} --principal-id ${userId} --principal-type USER --account-id ${accountId} --query 'AccountAssignments[*].PermissionSetArn' --output json`.json()

        for (const permissionSetArn of assignments) {
          if (!dryRun) {
            await $`aws --profile ${awsProfile} --region ${SSO_REGION} sso-admin delete-account-assignment --instance-arn ${instanceArn} --target-id ${accountId} --target-type AWS_ACCOUNT --permission-set-arn ${permissionSetArn} --principal-type USER --principal-id ${userId}`.quiet()
            console.info(`  ✓ Removed assignment from ${awsProfile}`)
          } else {
            console.info(`  [dry-run] Would remove assignment from ${awsProfile}`)
          }
        }
      } catch {
        console.info('  No assignments found')
      }

      console.info('\n✅ User assignments removed!')
      console.info(
        'Note: The user still exists in Identity Center but has no account access.'
      )
    }

    async function showHelp() {
      console.info(`
AWS IAM Identity Center User Management

Usage: bun scripts/aws/user-management.ts <command> [options]

Commands:
  add                     Add a new user
  remove                  Remove user's account assignments
  list                    List all users

Options:
  -e, --email            User email address
  -n, --name             User's full name (e.g., "John Doe")
  -d, --display-name     Display name (defaults to name)
  -p, --profile          Target profile (default: "prod")
                         Options: prod, production, dev, development
  -s, --permission-set   Permission set name (default: "AdministratorAccess")
  --dry-run              Preview changes without applying them

Examples:
  # Add a user to prod with admin access
  bun aws:user:add -e john@example.com -n "John Doe"

  # Add a user to dev environment
  bun aws:user:add -e jane@example.com -n "Jane Smith" -p dev

  # Remove a user's access
  bun scripts/aws/user-management.ts remove -e john@example.com -p prod

  # List all users in prod
  bun scripts/aws/user-management.ts list -p prod
`)
    }

    // main execution
    try {
      switch (command) {
        case 'add':
          await addUser()
          break
        case 'remove':
          await removeUser()
          break
        case 'list':
          await listUsers()
          break
        case 'help':
        case undefined:
          await showHelp()
          break
        default:
          console.error(`❌ Unknown command: ${command}`)
          await showHelp()
          process.exit(1)
      }
    } catch (error) {
      console.error('❌ Error:', error)
      process.exit(1)
    }
  })
