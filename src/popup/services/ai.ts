export async function askGPT({
  prompt,
  content,
}: {
  prompt: string
  content: string
}) {
  try {
    const response = await fetch('https://mattfletcher.dev/api/tabgpt', {
      method: 'POST',
      body: JSON.stringify({
        content,
        prompt,
      }),
    })

    if (response.ok) {
      const json = await response.json() as {
        data: {
          answer: string
        } | null
        error: null | {
          message: string
          code: string
        }
      }
      return json
    }

    throw new Error('Failed to fetch')
  }
  catch (error) {
    return {
      data: null,
      error: {
        message: 'An unknown error occurred',
        code: 'unknown',
      },
    }
  }
}
