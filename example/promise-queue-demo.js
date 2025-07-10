// 简化版的 Promise 队列机制 - 模拟 httpClient.ts 的核心逻辑

// 模拟全局状态
let isRefreshing = false;
let failedQueue = [];

// 模拟令牌存储
let currentToken = 'old-token';

// 模拟 API 调用
const mockApiCall = (requestId) => {
  return new Promise((resolve, reject) => {
    console.log(`📨 发起请求 ${requestId}`);
    
    // 模拟服务器响应 - 30% 概率令牌过期
    setTimeout(() => {
      if (Math.random() < 0.3) {
        console.log(`❌ 请求 ${requestId} - 令牌过期`);
        reject({ status: 401, message: 'Token expired' });
      } else {
        console.log(`✅ 请求 ${requestId} - 成功`);
        resolve({ data: `Response for ${requestId}`, token: currentToken });
      }
    }, 100);
  });
};

// 模拟刷新令牌
const refreshToken = () => {
  console.log('🔄 开始刷新令牌...');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.8) { // 80% 成功率
        currentToken = `new-token-${Date.now()}`;
        console.log(`🎉 令牌刷新成功: ${currentToken}`);
        resolve(currentToken);
      } else {
        console.log('💥 令牌刷新失败');
        reject(new Error('Refresh failed'));
      }
    }, 500); // 刷新需要更长时间
  });
};

// 处理队列中的所有 Promise
const processQueue = (error, token = null) => {
  console.log(`🔄 处理队列 (${failedQueue.length} 个请求)`);
  
  failedQueue.forEach(({ resolve, reject, requestId }) => {
    if (error) {
      console.log(`❌ 队列中的请求 ${requestId} 被拒绝`);
      reject(error);
    } else {
      console.log(`✅ 队列中的请求 ${requestId} 用新令牌重试`);
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 核心逻辑：带自动重试的 API 调用
const apiCallWithRetry = async (requestId) => {
  try {
    return await mockApiCall(requestId);
  } catch (error) {
    // 只有 401 错误才尝试刷新令牌
    if (error.status === 401) {
      console.log(`🔍 请求 ${requestId} 检测到令牌过期`);
      
      // 关键逻辑：如果正在刷新，加入队列等待
      if (isRefreshing) {
        console.log(`⏳ 请求 ${requestId} 加入等待队列`);
        
        // 返回一个 Promise，等待刷新完成
        return new Promise((resolve, reject) => {
          failedQueue.push({ 
            resolve: async (newToken) => {
              try {
                console.log(`🔄 请求 ${requestId} 用新令牌重试`);
                const result = await mockApiCall(requestId);
                resolve(result);
              } catch (retryError) {
                reject(retryError);
              }
            }, 
            reject,
            requestId 
          });
        });
      }
      
      // 开始刷新流程
      isRefreshing = true;
      console.log(`🚀 请求 ${requestId} 触发令牌刷新`);
      
      try {
        const newToken = await refreshToken();
        
        // 刷新成功，处理队列
        processQueue(null, newToken);
        
        // 重试原始请求
        console.log(`🔄 请求 ${requestId} 用新令牌重试`);
        return await mockApiCall(requestId);
        
      } catch (refreshError) {
        console.log(`💥 令牌刷新失败，拒绝所有队列请求`);
        
        // 刷新失败，拒绝所有队列中的请求
        processQueue(refreshError);
        throw error; // 抛出原始错误
        
      } finally {
        isRefreshing = false;
        console.log('🏁 刷新流程结束');
      }
    }
    
    throw error; // 非 401 错误直接抛出
  }
};

// 演示函数
const demonstratePromiseQueue = async () => {
  console.log('🎯 开始演示 Promise 队列机制\n');
  console.log('=' * 50);
  
  // 并发发起多个请求
  const requests = [
    apiCallWithRetry('A'),
    apiCallWithRetry('B'),
    apiCallWithRetry('C'),
    apiCallWithRetry('D'),
    apiCallWithRetry('E')
  ];
  
  try {
    const results = await Promise.allSettled(requests);
    
    console.log('\n📊 最终结果:');
    results.forEach((result, index) => {
      const requestId = String.fromCharCode(65 + index); // A, B, C, D, E
      if (result.status === 'fulfilled') {
        console.log(`✅ 请求 ${requestId}: 成功`);
      } else {
        console.log(`❌ 请求 ${requestId}: 失败 - ${result.reason.message}`);
      }
    });
    
  } catch (error) {
    console.error('演示过程中出错:', error);
  }
};

// 教学说明
console.log(`
📚 这个示例演示了 httpClient.ts 中的关键 Promise 逻辑:

1. 🔄 令牌刷新机制
   - 检测到 401 错误时自动刷新令牌
   - 使用 Promise 处理异步刷新过程

2. 📋 请求队列管理  
   - 当正在刷新时，新请求不会立即失败
   - 而是创建 Promise 加入队列等待

3. 🚦 并发控制
   - isRefreshing 标志防止多次同时刷新
   - failedQueue 数组管理等待的请求

4. 🎯 Promise 链式处理
   - 刷新成功 → 处理队列 → 重试原始请求
   - 刷新失败 → 拒绝所有队列中的请求

5. 🛡️ 错误处理
   - try/catch + finally 确保状态正确清理
   - Promise.allSettled 处理并发请求结果

运行演示:
`);

// 运行演示
demonstratePromiseQueue(); 