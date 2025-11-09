import { randomId } from '@tamatko/helpers'
import { s3Client } from '~/features/upload/s3client'
import { defaultBucket, uploadToS3 } from '~/features/upload/upload'

const folder = 'uploads'

// TODO: upload folder based on user or server

export default async function handler(req: Request) {
  // TODO
  // await ensureAuth(req)

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const formData = (await req.formData()) as unknown as FormData // not sure why this regressed
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'Failed to parse the form' }, { status: 500 })
  }

  // console.info(`[Upload API] File received: ${file.name}, type: ${file.type}, size: ${file.size}`)

  try {
    const key = `${folder}/${randomId()}-${file.name}`

    // console.info(`[Upload API] Non-video file, uploading to S3: ${key}`)
    const result = await uploadToS3(s3Client, {
      bucket: defaultBucket,
      key,
      body: file.stream(),
      contentType: file.type,
    })

    return new Response(
      JSON.stringify({ message: 'File uploaded successfully', ...result }),
      {
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to upload file', details: `${error}` }),
      {
        status: 500,
      }
    )
  }
}
