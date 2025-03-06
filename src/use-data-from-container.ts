import { useRef } from 'react'
import { Container } from './container'
import { DepsFn } from './types'
// 向后兼容的垫片React.useSyncExternalStore。适用于任何支持 Hooks 的 React。
import { useSyncExternalStore } from 'use-sync-external-store/shim'

/**
 * @description: 用于从 Container 中获取数据，并在数据变化时触发组件重新渲染。
 * 它的主要作用如下：
 * 订阅数据变化：通过 useSyncExternalStore 订阅 Container 中的数据变化，当数据变化时触发组件重新渲染。
 * 依赖管理：通过 depsFn 函数计算依赖项，并在依赖项变化时触发重新渲染。
 * 数据获取：直接从 Container 中获取当前数据。
 */
export function useDataFromContainer<T, P>(
  container: Container<T, P>,
  depsFn?: DepsFn<T>
): T {
  const depsFnRef = useRef(depsFn)
  depsFnRef.current = depsFn
  const depsRef = useRef<unknown[]>(depsFnRef.current?.(container.data) || [])

  return useSyncExternalStore(
    // 订阅函数，当 数据源 变化时会被调用
    onStoreChange => {
      function subscribe() {
        if (!depsFnRef.current) {
          // 当 container 中的数据发生变化时，组件都应该重新渲染
          onStoreChange()
        } else {
          const oldDeps = depsRef.current
          const newDeps = depsFnRef.current(container.data)
          if (compare(oldDeps, newDeps)) {
            onStoreChange()
          }
          depsRef.current = newDeps
        }
      }

      container.subscribers.add(subscribe)

      return () => {
        container.subscribers.delete(subscribe)
      }
    },
    // 数据源
    () => container.data
  )
}

function compare(oldDeps: unknown[], newDeps: unknown[]) {
  if (oldDeps.length !== newDeps.length) {
    return true
  }
  for (const index in newDeps) {
    if (oldDeps[index] !== newDeps[index]) {
      return true
    }
  }
  return false
}
