type Subscriber<T> = (data: T) => void

/**
 * @description: 管理和通知订阅者（subscribers）关于数据的变化
 *它主要用于存储通过 hook 函数生成的数据，并在数据变化时通知所有订阅者。

以下是 Container 类的主要功能：

存储数据：通过 hook 函数生成的数据存储在 data 属性中。
管理订阅者：使用 subscribers 集合来管理所有订阅者。
通知订阅者：当数据变化时，调用 notify 方法通知所有订阅者。
 */
export class Container<T = unknown, P = {}> {
  constructor(public hook: (props: P) => T) {}
  subscribers = new Set<Subscriber<T>>()
  data!: T

  notify() {
    for (const subscriber of this.subscribers) {
      subscriber(this.data)
    }
  }
}
