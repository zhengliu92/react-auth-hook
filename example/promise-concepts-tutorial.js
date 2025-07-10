// Promise 概念教学 - 从基础到 httpClient.ts 的复杂应用

console.log('🎓 Promise 概念教学开始\n');

// ===============================================
// 第一步：基础 Promise 概念
// ===============================================
console.log('📚 第一步：基础 Promise 概念');
console.log('-'.repeat(30));

// 1.1 创建 Promise
const basicPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('⏰ 1秒后执行');
    resolve('成功结果');
  }, 1000);
});

// 1.2 使用 Promise
basicPromise
  .then(result => console.log('✅ 成功:', result))
  .catch(error => console.log('❌ 失败:', error));

// ===============================================
// 第二步：Promise 队列概念
// ===============================================
setTimeout(() => {
  console.log('\n📚 第二步：Promise 队列概念');
  console.log('-'.repeat(30));
  
  // 模拟队列
  let queue = [];
  let isProcessing = false;
  
  const addToQueue = (taskName) => {
    return new Promise((resolve, reject) => {
      console.log(`📝 任务 ${taskName} 加入队列`);
      queue.push({ taskName, resolve, reject });
      
      // 如果没有在处理，开始处理
      if (!isProcessing) {
        processQueue();
      }
    });
  };
  
  const processQueue = async () => {
    if (queue.length === 0) return;
    
    isProcessing = true;
    console.log('🚀 开始处理队列');
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 处理所有队列中的任务
    while (queue.length > 0) {
      const { taskName, resolve } = queue.shift();
      console.log(`✅ 处理任务 ${taskName}`);
      resolve(`${taskName} 完成`);
    }
    
    isProcessing = false;
    console.log('🏁 队列处理完成');
  };
  
  // 演示：同时添加多个任务
  Promise.all([
    addToQueue('A'),
    addToQueue('B'), 
    addToQueue('C')
  ]).then(results => {
    console.log('📊 所有任务结果:', results);
  });
  
}, 1500);

// ===============================================
// 第三步：错误处理和重试机制
// ===============================================
setTimeout(() => {
  console.log('\n📚 第三步：错误处理和重试机制');
  console.log('-'.repeat(30));
  
  const attemptTask = (taskId, maxRetries = 3) => {
    let attempts = 0;
    
    const tryTask = () => {
      attempts++;
      console.log(`🔄 任务 ${taskId} 第 ${attempts} 次尝试`);
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 模拟 70% 失败率
          if (Math.random() < 0.7 && attempts < maxRetries) {
            console.log(`❌ 任务 ${taskId} 第 ${attempts} 次失败`);
            reject(new Error(`尝试 ${attempts} 失败`));
          } else {
            console.log(`✅ 任务 ${taskId} 成功`);
            resolve(`任务 ${taskId} 在第 ${attempts} 次尝试后成功`);
          }
        }, 200);
      });
    };
    
    const executeWithRetry = async () => {
      try {
        return await tryTask();
      } catch (error) {
        if (attempts < maxRetries) {
          console.log(`🔄 任务 ${taskId} 准备重试...`);
          return executeWithRetry(); // 递归重试
        } else {
          console.log(`💥 任务 ${taskId} 最终失败`);
          throw error;
        }
      }
    };
    
    return executeWithRetry();
  };
  
  // 演示重试机制
  attemptTask('重试演示')
    .then(result => console.log('🎉', result))
    .catch(error => console.log('😞 最终失败:', error.message));
    
}, 3000);

// ===============================================
// 第四步：httpClient.ts 的核心逻辑重现
// ===============================================
setTimeout(() => {
  console.log('\n📚 第四步：httpClient.ts 的核心逻辑');
  console.log('-'.repeat(30));
  
  // 状态管理
  let isRefreshing = false;
  let failedQueue = [];
  let currentToken = 'initial-token';
  
  // 模拟 API 请求
  const makeRequest = (requestId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 30% 概率令牌过期
        if (Math.random() < 0.3) {
          reject({ status: 401, message: 'Token expired' });
        } else {
          resolve({ data: `Data for ${requestId}`, token: currentToken });
        }
      }, 100);
    });
  };
  
  // 刷新令牌
  const refreshToken = () => {
    console.log('🔄 开始刷新令牌...');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        currentToken = `token-${Date.now()}`;
        console.log(`🎉 令牌刷新成功: ${currentToken.slice(-6)}`);
        resolve(currentToken);
      }, 300);
    });
  };
  
  // 处理等待队列
  const processFailedQueue = (error, token) => {
    failedQueue.forEach(({ resolve, reject, requestId }) => {
      if (error) {
        console.log(`❌ 拒绝队列中的请求 ${requestId}`);
        reject(error);
      } else {
        console.log(`✅ 用新令牌处理请求 ${requestId}`);
        resolve(token);
      }
    });
    failedQueue = [];
  };
  
  // 核心逻辑：自动刷新的请求
  const requestWithAutoRefresh = async (requestId) => {
    console.log(`📨 发起请求 ${requestId}`);
    
    try {
      return await makeRequest(requestId);
    } catch (error) {
      if (error.status === 401) {
        console.log(`🔍 请求 ${requestId} 检测到令牌过期`);
        
        // 关键部分：如果正在刷新，等待
        if (isRefreshing) {
          console.log(`⏳ 请求 ${requestId} 等待刷新完成`);
          
          return new Promise((resolve, reject) => {
            failedQueue.push({
              requestId,
              resolve: async (newToken) => {
                try {
                  console.log(`🔄 请求 ${requestId} 用新令牌重试`);
                  const result = await makeRequest(requestId);
                  resolve(result);
                } catch (retryError) {
                  reject(retryError);
                }
              },
              reject
            });
          });
        }
        
        // 开始刷新
        isRefreshing = true;
        
        try {
          const newToken = await refreshToken();
          processFailedQueue(null, newToken);
          
          // 重试原始请求
          console.log(`🔄 请求 ${requestId} 用新令牌重试`);
          return await makeRequest(requestId);
          
        } catch (refreshError) {
          processFailedQueue(refreshError);
          throw error;
        } finally {
          isRefreshing = false;
        }
      }
      throw error;
    }
  };
  
  // 演示：并发请求触发令牌刷新
  console.log('🚀 演示并发请求处理...');
  
  const concurrentRequests = [
    requestWithAutoRefresh('Alpha'),
    requestWithAutoRefresh('Beta'),
    requestWithAutoRefresh('Gamma'),
    requestWithAutoRefresh('Delta')
  ];
  
  Promise.allSettled(concurrentRequests)
    .then(results => {
      console.log('\n📊 并发请求最终结果:');
      results.forEach((result, index) => {
        const requestId = ['Alpha', 'Beta', 'Gamma', 'Delta'][index];
        if (result.status === 'fulfilled') {
          console.log(`✅ ${requestId}: 成功`);
        } else {
          console.log(`❌ ${requestId}: 失败`);
        }
      });
      
      console.log('\n🎓 Promise 教学完成！');
      console.log('💡 关键要点:');
      console.log('  1. Promise 队列避免重复的异步操作');
      console.log('  2. 状态管理确保操作的原子性');
      console.log('  3. 错误处理和重试提高系统健壮性');
      console.log('  4. 并发控制优化用户体验');
    });
    
}, 5000); 