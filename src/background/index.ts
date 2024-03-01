// 导入必要的模块和函数
import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderType } from '../config'
import { ChatGPTProvider, getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import { OpenAIProvider } from './providers/openai'
import { SparkProvider } from './providers/spark'
import { Provider } from './types'

function buildPrompt(prompt: string): string {
  return prompt
}

// 异步函数用于生成答案
async function generateAnswers(port: Browser.Runtime.Port, question: string) {
  // 获取提供者配置
  const providerConfigs = await getProviderConfigs()

  let provider: Provider
  // 根据配置确定使用的提供者
  if (providerConfigs.provider === ProviderType.Spark) {
    provider = new SparkProvider('79e7a2f5', 'NjhhNWJjZTFjYTI5MmI1NDQ0YjM1YjE1', 'da05bd7fd01886f7f993fed24ab789d7')
  } else if (providerConfigs.provider === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    provider = new ChatGPTProvider(token)
  } else if (providerConfigs.provider === ProviderType.GPT3) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
    provider = new OpenAIProvider(apiKey, model)
  } else {
    throw new Error(`未知提供者 ${providerConfigs.provider}`)
  }

  const controller = new AbortController()
  // 监听端口断开连接事件，以便中止生成答案操作
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })

  // 调用提供者的生成答案方法
  const { cleanup } = await provider.generateAnswer({
    prompt: question,
    signal: controller.signal,
    onEvent(event) {
      if (event.type === 'done') {
        port.postMessage({ event: 'DONE' })
        return
      }
      port.postMessage(event.data)
    },
  })
}

// 监听运行时连接事件
Browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    console.debug('接收到消息', msg)
    try {
      // 生成答案并发送回端口
      await generateAnswers(port, buildPrompt(msg.question))
    } catch (err: any) {
      console.error(err)
      port.postMessage({ error: err.message })
    }
  })
})

// 监听运行时消息事件
Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    // 发送消息反馈
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    // 打开选项页面
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    // 获取 ChatGPT 访问令牌
    return getChatGPTAccessToken()
  }
})

// 监听运行时安装事件
Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 在安装时打开选项页面
    Browser.runtime.openOptionsPage()
  }
})
