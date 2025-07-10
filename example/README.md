# Promise 学习示例

这个目录包含了两个帮助理解 `httpClient.ts` 中复杂 Promise 逻辑的学习示例。

## 📚 学习文件

### 1. `promise-concepts-tutorial.js` - 分步教学
这个文件从最基础的 Promise 概念开始，循序渐进地教学：

- **第一步**: 基础 Promise 概念
- **第二步**: Promise 队列概念  
- **第三步**: 错误处理和重试机制
- **第四步**: httpClient.ts 的核心逻辑重现

### 2. `promise-queue-demo.js` - 完整演示
这个文件专注演示 httpClient.ts 中的关键功能：

- 令牌刷新机制
- 请求队列管理
- 并发控制
- 错误处理

## 🚀 如何运行

### 运行循序渐进教学
```bash
node example/promise-concepts-tutorial.js
```

### 运行完整演示
```bash
node example/promise-queue-demo.js
```

## 🎯 学习要点

### httpClient.ts 的核心 Promise 逻辑

1. **令牌过期检测**
   ```javascript
   // 检测 401 错误
   if (error.response?.status === authConfig.access_expiration_code)
   ```

2. **并发控制**
   ```javascript
   // 防止多次同时刷新
   if (isRefreshing) {
     // 加入队列等待
     return new Promise((resolve, reject) => {
       failedQueue.push({ resolve, reject });
     });
   }
   ```

3. **队列处理**
   ```javascript
   // 刷新完成后批量处理等待的请求
   const processQueue = (error, token) => {
     failedQueue.forEach(({ resolve, reject }) => {
       if (error) reject(error);
       else resolve(token);
     });
   };
   ```

4. **状态管理**
   ```javascript
   try {
     isRefreshing = true;
     const newToken = await refreshTokenFn();
     processQueue(null, newToken);
   } finally {
     isRefreshing = false; // 确保状态清理
   }
   ```

## 🔍 关键概念对比

| 概念 | 简单版本 | httpClient.ts 实现 |
|------|----------|-------------------|
| **Promise 创建** | `new Promise((resolve, reject) => {})` | axios interceptor 返回 Promise |
| **队列管理** | 数组存储回调函数 | failedQueue 存储 resolve/reject |
| **并发控制** | isProcessing 标志 | isRefreshing 标志 |
| **错误处理** | try/catch | axios error + processQueue |

## 💡 学习建议

1. **先运行教学版本** - 理解基础概念
2. **再运行演示版本** - 看完整流程
3. **对比原始代码** - 理解实际应用
4. **修改参数实验** - 加深理解

### 可以尝试修改的参数

- 令牌过期概率 (`Math.random() < 0.3`)
- 刷新成功率 (`Math.random() < 0.8`) 
- 请求数量和并发数
- 超时时间

## 🤔 思考练习

1. 如果不使用队列，并发请求会发生什么？
2. 为什么需要 `isRefreshing` 标志？
3. `finally` 块的作用是什么？
4. 如何处理刷新令牌也失败的情况？

通过这些示例，你应该能更好地理解 httpClient.ts 中复杂的 Promise 调用逻辑！ 