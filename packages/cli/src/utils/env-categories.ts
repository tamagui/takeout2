import pc from 'picocolors'

import type { EnvVariable, EnvCategory } from '../types'

export const envCategories: EnvCategory[] = [
  {
    id: 'core',
    name: 'Core Configuration',
    description: 'Essential configuration for your production deployment',
    required: true,
    variables: [
      {
        key: 'BETTER_AUTH_SECRET',
        label: 'Authentication Secret',
        description: 'Secret key for session encryption and JWT signing',
        instructions: `Generate a secure random key:\n${pc.cyan('openssl rand -hex 32')}`,
        required: true,
        type: 'secret',
        generator: () => {
          const crypto = require('node:crypto')
          return crypto.randomBytes(32).toString('hex')
        },
      },
      {
        key: 'BETTER_AUTH_URL',
        label: 'Authentication URL',
        description: 'The public URL where your app will be hosted',
        instructions: 'Enter your production domain (e.g., https://your-app.com)',
        required: true,
        type: 'text',
        placeholder: 'https://your-app.com',
      },
      {
        key: 'ONE_SERVER_URL',
        label: 'Server URL',
        description: 'The URL for your main server',
        instructions: 'Usually the same as your authentication URL',
        required: true,
        type: 'text',
        placeholder: 'https://your-app.com',
      },
      {
        key: 'VITE_ZERO_HOSTNAME',
        label: 'Zero Sync Server Host',
        description: 'Hostname for real-time sync server',
        instructions:
          'Just the hostname, e.g., zero.your-app.com (https:// assumed in production)',
        required: true,
        type: 'text',
        placeholder: 'zero.your-app.com',
      },
    ],
  },
  {
    id: 'database',
    name: 'Database (PostgreSQL)',
    description:
      'Production database configuration - set by deployment platform (SST/uncloud)',
    required: false,
    variables: [
      // Note: ZERO_UPSTREAM_DB, ZERO_CVR_DB, and ZERO_CHANGE_DB are set dynamically
      // by the deployment platform (SST or uncloud) and should NOT be configured here
    ],
  },
  {
    id: 'storage',
    name: 'File Storage (S3/R2)',
    description: 'Object storage for user uploads and media files',
    required: false,
    variables: [
      {
        key: 'CLOUDFLARE_R2_ENDPOINT',
        label: 'Storage Endpoint',
        description: 'S3-compatible storage endpoint',
        instructions: `Options:\n${pc.cyan('Cloudflare R2')}: https://[account-id].r2.cloudflarestorage.com\n${pc.cyan('AWS S3')}: https://s3.[region].amazonaws.com\n${pc.cyan('DigitalOcean Spaces')}: https://[region].digitaloceanspaces.com`,
        required: false,
        type: 'text',
        placeholder: 'https://account-id.r2.cloudflarestorage.com',
      },
      {
        key: 'CLOUDFLARE_R2_ACCESS_KEY',
        label: 'Storage Access Key',
        description: 'Access key ID for your storage service',
        instructions: 'Get this from your storage provider dashboard',
        required: false,
        type: 'text',
      },
      {
        key: 'CLOUDFLARE_R2_SECRET_KEY',
        label: 'Storage Secret Key',
        description: 'Secret access key for your storage service',
        instructions: 'Keep this secure - it provides full access to your storage',
        required: false,
        type: 'secret',
      },
      {
        key: 'CLOUDFLARE_R2_PUBLIC_URL',
        label: 'Public Storage URL',
        description: 'Public URL for serving stored files',
        instructions: 'Usually a CDN URL or custom domain pointing to your bucket',
        required: false,
        type: 'text',
        placeholder: 'https://cdn.your-app.com',
      },
    ],
  },
  {
    id: 'apple',
    name: 'Apple App Store',
    description: 'Configuration for iOS app and push notifications',
    required: false,
    variables: [
      {
        key: 'APNS_TEAM_ID',
        label: 'Apple Team ID',
        description: 'Your Apple Developer Team ID',
        instructions: `Find in Apple Developer Portal:\n1. Go to ${pc.cyan('https://developer.apple.com/account')}\n2. Look for "Team ID" in Membership Details`,
        required: false,
        type: 'text',
        placeholder: 'XXXXXXXXXX',
      },
      {
        key: 'APNS_KEY_ID',
        label: 'APNs Key ID',
        description: 'Push notification authentication key ID',
        instructions: `Create in Apple Developer Portal:\n1. Go to Certificates, Identifiers & Profiles\n2. Keys → Create a Key\n3. Check "Apple Push Notifications service (APNs)"\n4. Download the .p8 file and note the Key ID`,
        required: false,
        type: 'text',
        placeholder: 'XXXXXXXXXX',
      },
      {
        key: 'APNS_KEY',
        label: 'APNs Key Content',
        description: 'Contents of your APNs .p8 key file',
        instructions: 'Paste the entire contents of the .p8 file you downloaded',
        required: false,
        type: 'multiline',
      },
      {
        key: 'APNS_ENDPOINT',
        label: 'APNs Endpoint',
        description: 'Apple Push Notification service endpoint',
        instructions: `Production: ${pc.green('https://api.push.apple.com')}\nSandbox: ${pc.yellow('https://api.sandbox.push.apple.com')}`,
        required: false,
        type: 'text',
        default: 'https://api.push.apple.com',
      },
    ],
  },
  {
    id: 'email',
    name: 'Email Service',
    description: 'Transactional email configuration',
    required: false,
    variables: [
      {
        key: 'POSTMARK_SERVER_TOKEN',
        label: 'Postmark Server Token',
        description: 'API token for sending emails via Postmark',
        instructions: `Get your token:\n1. Sign up at ${pc.cyan('https://postmarkapp.com')}\n2. Create a Server\n3. Go to Servers → API Tokens\n4. Copy your Server API Token\n\n${pc.yellow('Note: Free tier includes 100 emails/month')}`,
        required: false,
        type: 'text',
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub OAuth',
    description: 'Enable GitHub sign-in for your app',
    required: false,
    variables: [
      {
        key: 'ONECHAT_GITHUB_CLIENT_ID',
        label: 'GitHub OAuth Client ID',
        description: 'Client ID for GitHub OAuth application',
        instructions: `Create GitHub OAuth App:\n1. Go to ${pc.cyan('https://github.com/settings/developers')}\n2. New OAuth App\n3. Set Authorization callback URL:\n   ${pc.green('https://your-app.com/api/auth/callback/github')}\n4. Copy the Client ID`,
        required: false,
        type: 'text',
      },
      {
        key: 'ONECHAT_GITHUB_CLIENT_SECRET',
        label: 'GitHub OAuth Client Secret',
        description: 'Client secret for GitHub OAuth application',
        instructions: 'Copy the Client Secret from your GitHub OAuth App settings',
        required: false,
        type: 'secret',
      },
    ],
  },
  {
    id: 'aws',
    name: 'AWS Deployment',
    description: 'AWS credentials for SST deployment',
    required: false,
    setupTime: '~30 minutes',
    variables: [
      {
        key: 'AWS_ACCESS_KEY_ID',
        label: 'AWS Access Key ID',
        description: 'Access key for AWS deployment',
        instructions: `${pc.yellow('⚠️  Setting up AWS takes about 30 minutes')}\n\nFollow the SST guide for AWS setup:\n${pc.cyan('https://sst.dev/docs/aws-accounts/')}\n\nQuick steps:\n1. Create AWS account or use existing\n2. Create IAM user with AdministratorAccess\n3. Generate access keys\n4. Copy Access Key ID`,
        required: false,
        type: 'text',
      },
      {
        key: 'AWS_SECRET_ACCESS_KEY',
        label: 'AWS Secret Access Key',
        description: 'Secret key for AWS deployment',
        instructions: 'Copy the Secret Access Key from IAM user creation',
        required: false,
        type: 'secret',
      },
      {
        key: 'AWS_REGION',
        label: 'AWS Region',
        description: 'AWS region for deployment',
        instructions:
          'Choose a region close to your users (e.g., us-west-1, us-east-1, eu-west-1)',
        required: false,
        type: 'text',
        default: 'us-west-1',
        placeholder: 'us-west-1',
      },
    ],
  },
]

export function getCategoryById(id: string): EnvCategory | undefined {
  return envCategories.find((cat) => cat.id === id)
}

export function getRequiredCategories(): EnvCategory[] {
  return envCategories.filter((cat) => cat.required)
}

export function getOptionalCategories(): EnvCategory[] {
  return envCategories.filter((cat) => !cat.required)
}

export function getAllVariables(): EnvVariable[] {
  return envCategories.flatMap((cat) => cat.variables)
}

export function getVariableByKey(key: string): EnvVariable | undefined {
  return getAllVariables().find((v) => v.key === key)
}
