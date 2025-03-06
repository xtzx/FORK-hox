// 正常只使用这个
export { createStore } from './create-store'

// 下面两个都是全局状态使用的 api
export { createGlobalStore } from './create-global-store'
export { HoxRoot } from './hox-root'

// 官方文档没有这个 api
export { withStore } from './with-store'

export type { CreateStoreOptions } from './create-store'
