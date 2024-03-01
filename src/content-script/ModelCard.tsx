// 导入 Octicons 图标
import { LightBulbIcon, SearchIcon } from '@primer/octicons-react'
// 导入 useState 钩子
import { useState } from 'preact/hooks'
// 导入触发模式类型
import { TriggerMode } from '../config'
// 导入 ModelQuery 组件和查询状态类型
import ModelQuery, { QueryStatus } from './ModelQuery'
// 导入工具函数 endsWithQuestionMark
import { endsWithQuestionMark } from './utils.js'

// ModelCard 组件的属性
interface Props {
  question: string // 问题
  triggerMode: TriggerMode // 触发模式
  onStatusChange?: (status: QueryStatus) => void // 查询状态变化的回调函数
}

// ModelCard 组件
function ModelCard(props: Props) {
  // 状态：是否已触发
  const [triggered, setTriggered] = useState(false)

  // 根据触发模式渲染不同的内容
  if (props.triggerMode === TriggerMode.Always) {
    // 总是触发模式下，直接渲染 ModelQuery 组件
    return <ModelQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  if (props.triggerMode === TriggerMode.QuestionMark) {
    // 问号触发模式下，如果问题以问号结尾，则渲染 ModelQuery 组件
    if (endsWithQuestionMark(props.question.trim())) {
      return <ModelQuery question={props.question} onStatusChange={props.onStatusChange} />
    }
    // 否则显示提示信息
    return (
      <p className="icon-and-text">
        <LightBulbIcon size="small" /> Trigger ChatGPT by appending a question mark after your query
      </p>
    )
  }
  if (triggered) {
    // 如果已触发，则渲染 ModelQuery 组件
    return <ModelQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  // 否则显示触发按钮
  return (
    <p className="icon-and-text cursor-pointer" onClick={() => setTriggered(true)}>
      <SearchIcon size="small" /> Ask ChatGPT for this query
    </p>
  )
}

export default ModelCard
