const Promise = require('../lib/es6-promise.min').Promise

function promisify() {
  wx.pro = {}

  const functionName = [
    'login',
    'getUserInfo',
    'navigateTo',
    'checkSession',
    'getStorageInfo',
    'removeStorage',
    'clearStorage',
    'getNetworkType',
    'getSystemInfo',
  ]

  functionName.forEach(fnName => {
    wx.pro[fnName] = (obj = {}) => {
      return new Promise((resolve, reject) => {
        obj.success = function (res) {
          console.log(`wx.${fnName} success`, res)
          resolve(res)
        }
        obj.fail = function (err) {
          console.error(`wx.${fnName} fail`, err)
          reject(err)
        }
        wx[fnName](obj)
      })
    }
  })

  wx.pro.getStorage = key => {
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: key,
        success: res => {
          resolve(res.data) // unwrap data
        },
        fail: err => {
          resolve() // not reject, resolve undefined
        }
      })
    })
  }

  wx.pro.setStorage = (key, value) => {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key: key,
        data: value,
        success: res => {
          resolve(value) // 将数据返回
        },
        fail: err => {
          reject(err)
        }
      })
    })
  }

  wx.pro.request = options => {
    if (options.toast) {
      wx.showToast({
        title: options.toast.title || '加载中',
        icon: 'loading'
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: options.url,
        method: options.method || 'GET',
        data: options.data,
        header: options.header,
        success: res => {
          if (res.statusCode > 400) {
            console.error('wx.request fail [business]', options, res.statusCode, res.data)
            reject(res)
          } else {
            console.log('wx.request success', options, res.data)
            resolve(res.data) // unwrap data
          }
        },
        fail: err => {
          console.error('wx.request faile [network]', options, err)
          reject(err.errMsg)
        }
      })
    })
  }

  wx.pro.fetchData = options => {
    if (options.toast) {
      wx.showToast({
        title: options.toast.title || '加载中',
        icon: 'loading'
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: options.url,
        method: options.method || 'GET',
        data: options.data,
        header: options.header,
        success: res => {
          if (res.statusCode > 400) {
            console.error('wx.request fail [business]', options, res.statusCode, res.data)
            reject(res)
          }

          const response_data = res.data
          if (!response_data) {
            console.error('wx.request fail [return data error]', options, res.data)
            reject(res)
          }

          if (!response_data.success) {
            console.log('wx.request fail [server return error message]', options, res.data)
            reject(response_data.msg)
          } else {
            console.log('wx.request success', options, res.data)
            resolve(response_data.data)
          }
        },
        fail: err => {
          console.error('wx.request faile [network]', options, err)
          reject(err.errMsg)
        }
      })
    })
  }

  wx.pro.uploadFile = options => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: options.url,
        filePath: options.filePath,
        name: options.name,
        header: options.header,
        formData: options.formData,
        success: function (res) {
          if (!res || !res.data) {
            console.log("wx.uploadFile fail [return data error], options:", options, "res:", res)
            reject(res)
          }
          const response_data = JSON.parse(res.data);

          if (response_data && response_data.success && response_data.results && response_data.results.length) {
            console.log("wx.uploadFile success, options:", options, "res:", res)

            resolve(response_data.results[0])
          } else {
            console.log("wx.uploadFile fail [server return error message], options:", options, "res:", res)
            reject(res)
          }
        },
        fail: function (err) {
          console.error('wx.uploadFile fail [network]', options, err)
          reject(err)
        }
      })
    })
  }
}

promisify()

module.exports = Promise
