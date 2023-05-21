import { Configuration, OpenAIApi } from 'openai'

export async function askGPT({
  token,
  prompt,
  content,
}: {
  token: string
  prompt: string
  content: string
}) {
  const systemPrompt = `
    You are an assistant integrated into a Chrome extension that allows users to ask questions about the active web page. Your task is to answer these questions based on the provided web page or a selection of text from the web page.

    Guidelines:
    - Ensure your answers are relevant to the user's question and the context of the web page.
    - Provide clear and concise answers, avoiding unnecessary jargon or technical terms.
    - Use Markdown to format your response with headings, bullet points, links, quotes, or any other appropriate elements.
    - When including links, replace relative links with the full link (using the base url from websiteContext.url) and ensure proper Markdown formatting.
    - Back up your answer with helpful links to additional resources, such as other pages within the website, relevant articles, or other related websites.
    - Verify the credibility of the information on the web page and avoid providing misleading or incorrect information.
    - Base your answer on the websiteContent provided, but feel free to use the websiteContext and other resources to supplement your answer.
    - If you are unable to answer a question, guide the user on how to find the information or suggest alternative resources.
  `.replace(/\n\s+/g, '\n')

  try {
    const openai = new OpenAIApi(new Configuration({ apiKey: token }))
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'system',
          content: `Here is the information about the page: """${content}"""`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    return {
      data: {
        answer: completion.data.choices[0].message?.content ?? '',
      },
      status: completion.status,
      error: null,
    }
  }
  catch (error: any) {
    let errorMessage = 'Sorry, something went wrong. Please try again.'

    if (!error.response || !error.response.data)
      errorMessage = 'Sorry, something went wrong. Please try again.'

    else if (error.response.status === 400 && error.response.data.error.code === 'context_length_exceeded')
      errorMessage = 'Sorry, this web page is too long for me to read. Please select a smaller portion of the web page and try again.'

    else if (error.response.status === 402 && error.response.data.error.code === 'too_many_requests')
      errorMessage = 'Sorry, I am too busy right now. Please try again later.'

    else if (error.response.status === 402 && error.response.data.error.code === 'insufficient_funds')
      errorMessage = 'It looks like you have run out of credits. Please top up your OpenAI account and try again.'

    // Incorrect api key
    else if (error.response.status === 401)
      errorMessage = 'It looks like your OpenAI API key is mssing or incorrect. Please check your API key and try again.'

    return {
      data: null,
      status: (error.response?.status || 500) as number,
      error: {
        message: errorMessage,
      },
    }
  }
}
