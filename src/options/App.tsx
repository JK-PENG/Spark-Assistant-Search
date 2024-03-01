// 导入 Geist UI 组件和一些辅助函数
import { CssBaseline, GeistProvider, Radio, Select, Text, Toggle, useToasts } from '@geist-ui/core'
import { capitalize } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import '../base.css' // 导入基础样式
import { // 导入配置相关的函数和常量
  getUserConfig,
  Language,
  Theme,
  TriggerMode,
  TRIGGER_MODE_TEXT,
  updateUserConfig,
} from '../config'
import logo from '../logo.png' // 导入 logo 图片
import { detectSystemColorScheme, getExtensionVersion } from '../utils' // 导入一些工具函数
import ProviderSelect from './ProviderSelect' // 导入 ProviderSelect 组件

// Options 页面组件
function OptionsPage(props: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  // 状态：触发模式、语言
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(TriggerMode.Always)
  const [language, setLanguage] = useState<Language>(Language.Auto)
  const { setToast } = useToasts() // 使用 useToasts 获取 Toast 相关函数

  // 初始化加载用户配置
  useEffect(() => {
    getUserConfig().then((config) => {
      setTriggerMode(config.triggerMode)
      setLanguage(config.language)
    })
  }, [])

  // 处理触发模式变更
  const onTriggerModeChange = useCallback(
    (mode: TriggerMode) => {
      setTriggerMode(mode)
      updateUserConfig({ triggerMode: mode })
      setToast({ text: 'Changes saved', type: 'success' }) // 提示保存成功
    },
    [setToast],
  )

  // 处理主题变更
  const onThemeChange = useCallback(
    (theme: Theme) => {
      updateUserConfig({ theme })
      props.onThemeChange(theme)
      setToast({ text: 'Changes saved', type: 'success' }) // 提示保存成功
    },
    [props, setToast],
  )

  // 处理语言变更
  const onLanguageChange = useCallback(
    (language: Language) => {
      updateUserConfig({ language })
      setToast({ text: 'Changes saved', type: 'success' }) // 提示保存成功
    },
    [setToast],
  )

  return (
    <div className="container mx-auto">
      {/* 导航栏 */}
      <nav className="flex flex-row justify-between items-center mt-5 px-2">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} className="w-10 h-10 rounded-lg" /> {/* Logo */}
          <span className="font-semibold">Spark Assistant Search (v{getExtensionVersion()})</span> {/* 应用名称 */}
        </div>
      </nav>
      {/* 主要内容区域 */}
      <main className="w-[500px] mx-auto mt-14">
        {/* 标题 */}
        <Text h2>Options</Text>
        {/* 触发模式 */}
        <Text h3 className="mt-5">
          触发模式
        </Text>
        <Radio.Group
          value={triggerMode}
          onChange={(val) => onTriggerModeChange(val as TriggerMode)}
        >
          {/* 渲染触发模式选项 */}
          {Object.entries(TRIGGER_MODE_TEXT).map(([value, texts]) => {
            return (
              <Radio key={value} value={value}>
                {texts.title}
                <Radio.Description>{texts.desc}</Radio.Description>
              </Radio>
            )
          })}
        </Radio.Group>
        {/* 主题 */}
        <Text h3 className="mt-5">
          主题
        </Text>
        <Radio.Group value={props.theme} onChange={(val) => onThemeChange(val as Theme)} useRow>
          {/* 渲染主题选项 */}
          {Object.entries(Theme).map(([k, v]) => {
            return (
              <Radio key={v} value={v}>
                {k}
              </Radio>
            )
          })}
        </Radio.Group>
        {/* 语言 */}
        <Text h3 className="mt-5 mb-0">
          语言
        </Text>
        <Text className="my-1">
          Spark 响应中使用的语言。 <span className="italic">Auto</span> 是推荐的方式。
        </Text>
        {/* 渲染语言选择器 */}
        <Select
          value={language}
          placeholder="Choose one"
          onChange={(val) => onLanguageChange(val as Language)}
        >
          {Object.entries(Language).map(([k, v]) => (
            <Select.Option key={k} value={v}>
              {capitalize(v)}
            </Select.Option>
          ))}
        </Select>
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
      </main>
    </div>
  )
}

// 主应用组件
function App() {
  // 状态：主题
  const [theme, setTheme] = useState(Theme.Auto)

  // 计算主题类型
  const themeType = useMemo(() => {
    if (theme === Theme.Auto) {
      return detectSystemColorScheme()
    }
    return theme
  }, [theme])

  // 初始化加载用户配置
  useEffect(() => {
    getUserConfig().then((config) => setTheme(config.theme))
  }, [])

  return (
    <GeistProvider themeType={themeType}>
      <CssBaseline />
      {/* 渲染 Options 页面 */}
      <OptionsPage theme={theme} onThemeChange={setTheme} />
    </GeistProvider>
  )
}

export default App
