// 导入 Geist UI 组件和一些辅助函数
import { CssBaseline, GeistProvider, Radio, Select, Text, Toggle, useToasts } from '@geist-ui/core'
import '../base.css' // 导入基础样式
import ProviderSelect from '../options/ProviderSelect' // 导入 ProviderSelect 组件
import logo from '../logo.png' // 导入 logo 图片

// 检测当前浏览器是否为 Chrome
const isChrome = /chrome/i.test(navigator.userAgent)

// 主应用组件
function App() {

  return (
    <div className="container mx-auto">
        {/* AI Provider */}
        <Text h3 className="mt-5 mb-0">
          AI 提供者
        </Text>
        {/* 渲染 AI Provider 选择器 */}
        <ProviderSelect />
        {/* 其他设置 */}
        <Text h3 className="mt-8">
          其他设置
        </Text>
        <div className="flex flex-row items-center gap-4">
          <Toggle initialChecked disabled />
          <Text b margin={0}>
            自动删除搜索生成的对话
          </Text>
        </div>
    </div>
  )
}

export default App
