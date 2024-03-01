// 导入所需模块和样式
import { render } from 'preact'
import '../base.css'
import { getUserConfig, Language, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ModelContainer from './ModelContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

// 异步函数用于挂载带有指定问题和站点配置的 ChatGPT 容器
async function mount(question: string, siteConfig: SearchEngine) {
  // 创建一个 div 元素来容纳 ChatGPT 界面
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  // 获取用户配置并根据用户喜好或系统颜色方案确定主题
  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }

  // 根据所选主题添加 CSS 类
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  // 根据站点配置确定应插入 ChatGPT 的容器
  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    // 将 ChatGPT 容器插入指定的侧边栏容器中
    siderbarContainer.prepend(container)
  } else {
    // 如果找不到侧边栏容器，则使用独立布局
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  // 使用指定问题和触发模式渲染 ChatGPT 界面
  render(
    <ModelContainer question={question} triggerMode={userConfig.triggerMode || 'always'} />,
    container,
  )
}

// 正则表达式用于基于配置匹配站点名称
const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]

// 异步函数用于运行 ChatGPT 挂载过程
async function run() {
  // 基于站点配置获取搜索输入元素
  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  if (searchInput && searchInput.value) {
    // 当搜索输入具有值时，记录调试消息并挂载 ChatGPT
    console.debug('Mount ChatGPT on', siteName)
    const userConfig = await getUserConfig()
    const searchValueWithLanguageOption =
      userConfig.language === Language.Auto
        ? searchInput.value
        : `${searchInput.value}(in ${userConfig.language})`
    mount(searchValueWithLanguageOption, siteConfig)
  }
}

// 初始运行 ChatGPT 挂载过程
run()

// 如果在站点配置中指定了，则监听路由更改
if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
