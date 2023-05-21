interface FetchPageContentFunction {
  (): Promise<string>
}

interface FetchPageSelectionFunction {
  (): Promise<string>
}

interface FetchPageDetailsFunction {
  (): Promise<{
    url: string
    icon: string
    title: string
    description: string
  }>
}

interface WebPageContentFetchers {
  fetchPageContent: FetchPageContentFunction
  fetchPageSelection: FetchPageSelectionFunction
  fetchPageDetails: FetchPageDetailsFunction
}

const fetchPageDetailsChrome: FetchPageDetailsFunction = async () => {
  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    func: () => document.querySelector('head')?.innerHTML ?? '',
  })
  const parser = new DOMParser()
  const doc = parser.parseFromString(res.result, 'text/html')
  const url = tab.url ?? ''
  const icon = (!tab.favIconUrl || tab.favIconUrl.endsWith('.ico')) ? '' : tab.favIconUrl
  const title = doc.querySelector('title')?.innerText ?? ''
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
  return {
    url,
    icon,
    title,
    description,
  }
}

const fetchPageContentChrome: FetchPageContentFunction = async () => {
  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    func: () => document.querySelector('html')?.innerHTML ?? '',
  })
  return res.result
}

const fetchPageSelectionChrome: FetchPageSelectionFunction = async () => {
  const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id as number },
    func: () => window.getSelection()?.toString() || '',
  })
  return res.result
}

class WebPageContentChrome implements WebPageContentFetchers {
  fetchPageContent: FetchPageContentFunction
  fetchPageSelection: FetchPageSelectionFunction
  fetchPageDetails: FetchPageDetailsFunction

  constructor({
    fetchPageContent,
    fetchPageSelection,
    fetchPageDetails,
  }: {
    fetchPageContent: FetchPageContentFunction
    fetchPageSelection: FetchPageSelectionFunction
    fetchPageDetails: FetchPageDetailsFunction
  }) {
    this.fetchPageContent = fetchPageContent
    this.fetchPageSelection = fetchPageSelection
    this.fetchPageDetails = fetchPageDetails
  }
}

export const webPageContentChromeService = new WebPageContentChrome({
  fetchPageContent: fetchPageContentChrome,
  fetchPageSelection: fetchPageSelectionChrome,
  fetchPageDetails: fetchPageDetailsChrome,
})
