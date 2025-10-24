import { createReadStream, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { s3Client } from '~/features/upload/s3client'
import { defaultBucket, uploadToS3 } from '~/features/upload/upload'

// Read version and productName from tauri.conf.json
const tauriConfig = JSON.parse(
  readFileSync(join(__dirname, '../tauri.conf.json'), 'utf-8')
)
const version = tauriConfig.version
const productName = tauriConfig.productName

// Ensure we're not uploading a dev build
if (productName === 'start.chat.dev') {
  console.error('ERROR: Attempting to upload dev build! productName is "start.chat.dev"')
  console.error('This should be "start.chat" for production releases.')
  process.exit(1)
}

const DMG_PATH = join(
  __dirname,
  `../target/release/bundle/dmg/${productName}_${version}_aarch64.dmg`
)

const TAR_GZ_PATH = join(
  __dirname,
  `../target/release/bundle/macos/${productName}.app.tar.gz`
)

const HASH_FILE_PATH = join(__dirname, '../../../.tauri-hash')

async function uploadTauriRelease() {
  console.info('Starting upload of Tauri release...')
  console.info(`Product: ${productName} v${version}`)

  try {
    // Upload the DMG file for direct downloads
    const dmgStream = createReadStream(DMG_PATH)
    const dmgKey = `releases/macos/latest.dmg`

    const dmgResult = await uploadToS3(s3Client, {
      bucket: defaultBucket,
      key: dmgKey,
      body: dmgStream,
      contentType: 'application/octet-stream',
      isPublic: true,
    })

    console.info('DMG upload successful!')
    console.info('DMG URL:', dmgResult.url)

    // Upload the tar.gz file for auto-updates (this is what gets signed)
    const tarGzStream = createReadStream(TAR_GZ_PATH)
    const tarGzKey = `releases/macos/latest.tar.gz`

    const tarGzResult = await uploadToS3(s3Client, {
      bucket: defaultBucket,
      key: tarGzKey,
      body: tarGzStream,
      contentType: 'application/gzip',
      isPublic: true,
    })

    console.info('tar.gz upload successful!')
    console.info('tar.gz URL:', tarGzResult.url)

    // Upload the hash file (required)
    if (!existsSync(HASH_FILE_PATH)) {
      console.error('ERROR: Hash file not found at', HASH_FILE_PATH)
      console.error('The hash file must be generated before upload.')
      console.error('Run: bun ./src/tauri/scripts/check-tauri-changed.ts --update')
      process.exit(1)
    }

    const hashContent = readFileSync(HASH_FILE_PATH, 'utf-8')
    const hashKey = `releases/macos/latest-hash.txt`

    const hashResult = await uploadToS3(s3Client, {
      bucket: defaultBucket,
      key: hashKey,
      body: hashContent,
      contentType: 'text/plain',
      isPublic: true,
    })

    console.info('Hash file upload successful!')
    console.info('Hash URL:', hashResult.url)

    return { dmg: dmgResult, tarGz: tarGzResult, hash: hashResult }
  } catch (error) {
    console.error('Upload failed:', error)
    process.exit(1)
  }
}

await uploadTauriRelease()
