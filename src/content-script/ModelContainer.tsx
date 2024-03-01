// 导入 React 相关的模块和函数
import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { fetchPromotion } from '../api' // 导入获取推广信息的函数
import { TriggerMode } from '../config' // 导入触发模式相关的类型和常量
import ModelCard from './ModelCard' // 导入 ModelCard 组件
import { QueryStatus } from './ModelQuery' // 导入查询状态类型
import Promotion from './Promotion' // 导入推广组件

// ChatGPT 容器组件接收的属性
interface Props {
  question: string // 问题
  triggerMode: TriggerMode // 触发模式
}

// ChatGPT 容器组件
function ModelContainer(props: Props) {
  // 状态：查询状态
  const [queryStatus, setQueryStatus] = useState<QueryStatus>()

  // 使用 useSWRImmutable 进行数据获取
  const query = useSWRImmutable(
    // 根据查询状态决定是否发起获取推广信息的请求
    queryStatus === 'success' ? 'promotion' : undefined,
    fetchPromotion, // 获取推广信息的函数
    { shouldRetryOnError: false }, // 不在出错时重试
  )

  return (
    <>
      <div className="chat-gpt-card">
        {/* 渲染 ModelCard 组件 */}
        <ModelCard
          question={props.question} // 传递问题
          triggerMode={props.triggerMode} // 传递触发模式
          onStatusChange={setQueryStatus} // 设置查询状态改变的回调函数
        />
      </div>
      {/* 如果查询成功且有数据，则渲染推广组件 */}
      {query.data && <Promotion data={query.data} />}
    </>
  )
}

export default ModelContainer
