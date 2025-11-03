import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export async function ensureS3Bucket(
  bucketName: string,
  options?: {
    region?: string
    retentionDays?: number
  }
): Promise<void> {
  const region = options?.region ?? 'us-west-1'
  const retentionDays = options?.retentionDays ?? 30

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  try {
    // check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
    console.info(`✅ S3 bucket exists: ${bucketName}`)
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.info(`📦 Creating S3 bucket: ${bucketName}`)

      // create bucket
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
          ...(region !== 'us-east-1' && {
            CreateBucketConfiguration: {
              LocationConstraint: region as any,
            },
          }),
        })
      )

      // enable versioning for safety
      await s3Client.send(
        new PutBucketVersioningCommand({
          Bucket: bucketName,
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        })
      )

      // set lifecycle policy to automatically delete old backups
      await s3Client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'delete-old-backups',
                Status: 'Enabled',
                Filter: {
                  Prefix: 'db-backups/',
                },
                Expiration: {
                  Days: retentionDays,
                },
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 7,
                },
              },
            ],
          },
        })
      )

      console.info(
        `✅ S3 bucket created with ${retentionDays} day retention: ${bucketName}`
      )
    } else {
      throw error
    }
  }
}
