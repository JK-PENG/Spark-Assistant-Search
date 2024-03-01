// 导入 React 和 Preact 钩子、组件
import { GearIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'preact/hooks'
import { memo, useCallback } from 'react'
// 导入 React Markdown 组件和rehype-highlight插件
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
// 导入浏览器扩展 API
import Browser from 'webextension-polyfill'
// 导入分析函数和工具函数
import { captureEvent } from '../analytics'
import { Answer } from '../messaging'
import ModelFeedback from './ModelFeedback'
import { isBraveBrowser, shouldShowRatingTip } from './utils.js'

// 查询状态类型
export type QueryStatus = 'success' | 'error' | undefined

// ModelQuery 组件属性
interface Props {
  question: string // 问题
  onStatusChange?: (status: QueryStatus) => void // 查询状态变化的回调函数
}

// ModelQuery 组件
function ModelQuery(props: Props) {
  // 状态：回答
  const [answer, setAnswer] = useState<Answer | null>(null)
  // 状态：错误信息
  const [error, setError] = useState('')
  // 状态：重试次数
  const [retry, setRetry] = useState(0)
  // 状态：完成标志
  const [done, setDone] = useState(false)
  // 状态：显示提示
  const [showTip, setShowTip] = useState(false)
  // 状态：查询状态
  const [status, setStatus] = useState<QueryStatus>()

  // 使用 useEffect 监听查询状态的变化
  useEffect(() => {
    props.onStatusChange?.(status)
  }, [props, status])

  // 使用 useEffect 发起查询
  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      if (msg.text) {
        setAnswer(msg)
        setStatus('success')
      } else if (msg.error) {
        setError(msg.error)
        setStatus('error')
      } else if (msg.event === 'DONE') {
        setDone(true)
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question, retry])

  // 在焦点事件中重试错误
  useEffect(() => {
    const onFocus = () => {
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  // 显示评分提示
  useEffect(() => {
    shouldShowRatingTip().then((show) => setShowTip(show))
  }, [])

  // 显示回答时触发事件
  useEffect(() => {
    if (status === 'success') {
      captureEvent('show_answer', { host: location.host, language: navigator.language })
    }
  }, [props.question, status])

  // 打开选项页面的回调函数
  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  // 根据状态渲染不同的内容
  if (answer) {
    return (
      <div className="markdown-body gpt-markdown" id="gpt-answer" dir="auto">
        <div className="gpt-header">
          <span className="font-bold">Spark Assistant</span>
          <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
            <GearIcon size={14} />
          </span>
          <ModelFeedback
            messageId={answer.messageId}
            conversationId={answer.conversationId}
            answerText={answer.text}
          />
        </div>
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {answer.text}
        </ReactMarkdown>
        {done && showTip && (
          <p className="italic mt-2">
            Enjoy this extension? Give us a 5-star rating at{' '}
            <a
              href="https://chatgpt4google.com/chrome?utm_source=rating_tip"
              target="_blank"
              rel="noreferrer"
            >
              Chrome Web Store
            </a>
          </p>
        )}
      </div>
    )
  }

  if (error === 'UNAUTHORIZED' || error === 'CLOUDFLARE') {
    return (
      <p>
        Please login and pass Cloudflare check at{' '}
        <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
          chat.openai.com
        </a>
        {retry > 0 &&
          (() => {
            if (isBraveBrowser()) {
              return (
                <span className="block mt-2">
                  Still not working? Follow{' '}
                  <a href="https://github.com/wong2/chat-gpt-google-extension#troubleshooting">
                    Brave Troubleshooting
                  </a>
                </span>
              )
            } else {
              return (
                <span className="italic block mt-2 text-xs">
                  OpenAI requires passing a security check every once in a while. If this keeps
                  happening, change AI provider to OpenAI API in the extension options.
                </span>
              )
            }
          })()}
      </p>
    )
  }
  if (error) {
    return (
      <p>
        Failed to load response from ChatGPT:
        <span className="break-all block">{error}</span>
      </p>
    )
  }

  return <p className="text-[#b6b8ba] animate-pulse">Waiting for Spark response...</p>
}

export default memo(ModelQuery)
