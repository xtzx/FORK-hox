import React, {
  createContext,
  FC,
  memo,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Container } from './container'
import { DepsFn } from './types'
import { useDataFromContainer } from './use-data-from-container'

export type CreateStoreOptions = {
  memo?: boolean
}

const fallbackContainer = new Container<any>(() => {})

/**
 * @description:
 *
 * 主要作用是：
 * 创建一个共享状态的上下文：通过 React 的 Context API 创建一个 StoreContext，用于在组件树中共享状态。
 * 提供状态的隔离和持久化：通过 StoreProvider 组件将状态注入到组件树中，并确保状态在组件树中是持久化的。
 * 提供状态的订阅和更新：通过 useStore Hook 订阅和获取状态，并在状态更新时通知组件重新渲染。
 */
export function createStore<T, P extends {} = {}>(
  // 返回状态和set方法的 hooks 函数
  hook: (props: P) => T,
  options?: CreateStoreOptions
) {
  const shouldMemo = options?.memo ?? true
  // TODO: forwardRef
  // 状态存储在此
  const StoreContext = createContext<Container<T, P>>(fallbackContainer)

  // 负责存储子节点信息
  // 防止子节点在状态更新时被意外修改
  const IsolatorContext = createContext({
    node: undefined as React.ReactNode,
  })

  /**
   * @description:
   * 第一层
   * 功能:
   * 提供一个 context 来存储 node: props.children
   * 继续向下渲染 {props.children}
   */
  const IsolatorOuter: FC<
    PropsWithChildren<{
      node: React.ReactNode
    }>
  > = props => {
    return (
      <IsolatorContext.Provider
        value={{
          node: props.node,
        }}
      >
        {props.children}
      </IsolatorContext.Provider>
    )
  }

  /**
   * @description:
   * 第二层
   * {...props} 中的 children 会和组件本身 props.children 相互覆盖
   *
   * 功能:
   * 本层存储的自定义状态
   * 可以去掉 memo(StoreExecutor)，它没有实际优化作用。
   */
  const StoreExecutor = memo<PropsWithChildren<P>>(props => {
    const { children, ...p } = props

    // useState 可能是做了 useMemo 的功能
    const [container] = useState(() => new Container<T, P>(hook))

    // 此处执行了自定义的 hooks 函数,参数是给 Provide 的 props
    // data 是 status + set
    container.data = hook(p as P)

    // 每次更新都会调用 notify
    useEffect(() => {
      container.notify()
    })

    return (
      <StoreContext.Provider value={container}>
        {props.children}
      </StoreContext.Provider>
    )
  })

  /**
   * @description:
   * 第三层:存在意义何在? 每次不会重新渲染 IsolatorInner
   * 状态隔离：IsolatorOuter 提供了一个上下文 (IsolatorContext)，用于存储 node（即 props.children）。
   * IsolatorInner 从这个上下文中读取 node 并渲染它。
   * 这种设计确保了 props.children 在 StoreExecutor 组件重新渲染时不会被意外修改。
   *
   * 功能:
   * 从第一层读取了 node: props.children 并渲染
   *
   */
  const IsolatorInner = memo<PropsWithChildren<{}>>(
    props => {
      const { node } = useContext(IsolatorContext)
      return <>{node}</>
    },
    // 表示不会重新渲染
    () => true
  )

  /**
   * @description: 最终导出的 状态的容器
   */
  const StoreProvider: FC<PropsWithChildren<P>> = props => {
    // 在 StoreExecutor 重新渲染时，props.children 也会重新渲染，可能会导致不必要的性能开销和状态丢失。
    // return (
    //     <StoreExecutor {...props}>
    //       {props.children}
    //     </StoreExecutor>
    // )
    return (
      <IsolatorOuter node={props.children}>
        <StoreExecutor {...props}>
          <IsolatorInner />
        </StoreExecutor>
      </IsolatorOuter>
    )
  }

  /**
   * @description:
   * 传入一个 depsFn 函数，来精确控制订阅的字段
   */
  function useStore(depsFn?: DepsFn<T>): T {
    const container = useContext(StoreContext)

    // 表示没有进行初始化 还是原始的
    if (container === fallbackContainer) {
      // TODO
      console.error(
        "Failed to retrieve the store data from context. Seems like you didn't render a outer StoreProvider."
      )
    }

    // 当 container 变化的时候就会会触发渲染
    return useDataFromContainer(container, depsFn)
  }

  // 现在不确认是  container.data = hook(p as P) 修改 context 值的时候导致的渲染还是依赖 useDataFromContainer

  return [useStore, shouldMemo ? memo(StoreProvider) : StoreProvider] as const
}
