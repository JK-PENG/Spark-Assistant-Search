// 导入lodash的defaults函数和Browser对象
import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'

// 触发模式枚举
export enum TriggerMode {
  Always = 'always',
  QuestionMark = 'questionMark',
  Manually = 'manually',
}

// 触发模式对应的文字描述
export const TRIGGER_MODE_TEXT = {
  [TriggerMode.Always]: { title: '总是', desc: '在每次搜索时都查询 Spark' },
  [TriggerMode.QuestionMark]: {
    title: '问号',
    desc: '当您的查询以问号结尾时（?）',
  },
  [TriggerMode.Manually]: {
    title: '手动',
    desc: '当您手动点击按钮时查询 Spark',
  },
}

// 主题枚举
export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

// 语言枚举
export enum Language {
  Auto = 'auto',
  English = 'english',
  Chinese = 'chinese',
  Spanish = 'spanish',
  French = 'french',
  Korean = 'korean',
  Japanese = 'japanese',
  German = 'german',
  Portuguese = 'portuguese',
}

// 用户配置默认值
const userConfigWithDefaultValue = {
  triggerMode: TriggerMode.Always,
  theme: Theme.Auto,
  language: Language.Auto,
}

// 用户配置类型
export type UserConfig = typeof userConfigWithDefaultValue

// 获取用户配置
export async function getUserConfig(): Promise<UserConfig> {
  const result = await Browser.storage.local.get(Object.keys(userConfigWithDefaultValue))
  return defaults(result, userConfigWithDefaultValue)
}

// 更新用户配置
export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  return Browser.storage.local.set(updates)
}

// AI提供者类型枚举
export enum ProviderType {
  Spark = 'Spark',
  ChatGPT = 'chatgpt',
  GPT3 = 'gpt3',
}

// GPT-3提供者配置接口
interface GPT3ProviderConfig {
  model: string
  apiKey: string
}

// 提供者配置接口
export interface ProviderConfigs {
  provider: ProviderType
  configs: {
    [ProviderType.GPT3]: GPT3ProviderConfig | undefined
  }
}

// 获取提供者配置
export async function getProviderConfigs(): Promise<ProviderConfigs> {
  const { provider = ProviderType.Spark } = await Browser.storage.local.get('provider')
  const configKey = `provider:${ProviderType.GPT3}`
  const result = await Browser.storage.local.get(configKey)
  return {
    provider,
    configs: {
      [ProviderType.GPT3]: result[configKey],
    },
  }
}

// 保存提供者配置
export async function saveProviderConfigs(
  provider: ProviderType,
  configs: ProviderConfigs['configs'],
) {
  return Browser.storage.local.set({
    provider,
    [`provider:${ProviderType.GPT3}`]: configs[ProviderType.GPT3],
  })
}
