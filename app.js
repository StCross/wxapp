//app.js
const { findUserInfo, fetchUserLogin, updateUserUnion } = require('./action/fetch')
const broadcast = require('./lib/broadcast')
const Promise = require('./utils/wx-pro')

App({
  globalData: {
    userInfo: null
  },
  onLaunch: function () {
    console.log("app, onLanch.")
    const that = this
    wx.checkSession({
      success: function () {
        //session 未过期，并且在本生命周期一直有效
        console.log('未过期')
        that.autoTestTokenValid()
      },
      fail: function () {
        //登录态过期
        //wx.login() //重新登录
        console.log('过期')
        wx.authorize({
          scope: 'scope.userInfo',
          success() {
            wx.getUserInfo({
              success: function (res) {
                const encryptedData = res.encryptedData
                const iv = res.iv
                that.autoLogin(encryptedData,iv).then(user_info => {
                  broadcast.fire("token_refresh_success", user_info)
                })
              }
            })
          }
        })
      }
    })
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // wx.authorize({
    //   scope: 'scope.userInfo',
    //   success() {
    //     console.log("授权了")
    //     wx.getStorage({
    //       key: 'userInfo',
    //       success: function (res) {
    //         // success
    //         that.autoTestTokenValid().then(user_info => {
    //           broadcast.fire("token_refresh_success", user_info)
    //         })
    //       },
    //       fail: function () {
    //         // fail
    //         console.log("get userInfo fail")
    //         wx.getUserInfo({
    //           success: function (res) {
    //             const encryptedData = res.encryptedData
    //             const iv = res.iv
    //             console.log(encryptedData,iv)
    //             that.autoLogin(encryptedData, iv).then(user_info => {
    //               broadcast.fire("token_refresh_success", user_info)
    //             })
    //           }
    //         })
    //         // that.autoLogin().then(user_info => {
    //         //   broadcast.fire("token_refresh_success", user_info)
    //         // })
    //       }
    //     })
    //     // this.autoLogin()
    //     broadcast.on("token_refresh_success", user_info => {
    //     })
    //   }
    // })

  },
  onShow() {
    console.log("app, onShow.")
  },
  autoTestTokenValid() {
    const that = this
    console.log("app.js, autoTestTokenValid.")
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: 'userInfo',
        success: function (res) {
          const token = res.data.data.token,
            userId = res.data.data.userId,
            userName = res.data.data.username
          if (res.data && token) {
            findUserInfo(token).then(user_info => {
              // resolve(user_info)
              
            }).catch(error => {
              that.autoLogin().then(user_info => {
                broadcast.fire("token_refresh_success", user_info)

                resolve(user_info)
              })
            })
          }
        }
      })
    })
  },
  autoLogin: function (encryptedData,iv) {
    const that = this
    console.log("app.js, autoLogin.", encryptedData,iv)

    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (!res.code) {
            return
          }
          const code = res.code
          console.log(res)
          fetchUserLogin(code, encryptedData,iv).then(resData => {
            const nickName = resData.data.nickname
            // console.log(typeof nickName)
            wx.setStorage({
              key: 'userInfo',
              data: resData,
              success: function (res) {
                resolve(resData)
              }
            })
            // 判断是否首次登录小程序
            if (!nickName) {
              // 获取用户信息
              wx.getUserInfo({
                success: res => {
                  console.log("app.js, getUserInfo, success, res:", res)
                  wx.setStorageSync('firstInfo', res.userInfo)

                  console.log('firstInfo:', wx.getStorageSync("firstInfo"))

                  // 更新后台用户数据
                  console.log('更新用户信息: updataUserInfo')
                  that.updataUserInfo()
                }
              })
            }
          }).catch(error => {
            // TOOD: 登录失败，弹窗提示用户错误信息
            reject(error)
          })
        }
      })
    })
  },
  // 更新用户信息
  updataUserInfo() {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: 'userInfo',
        success: function (res) {
          const wxInfo = wx.getStorageSync("firstInfo"),
            avatar = wxInfo.avatarUrl,
            nickname = wxInfo.nickName;

          const user_data = res.data.data,
            userId = user_data.userId,
            token = user_data.token;
          console.log(user_data)
          // success
          if (user_data) {

            updateUserUnion(token, userId, avatar, nickname).then(ree => {
              resolve(ree)
            })
          }
        },
      })
    })
  },
  // 获取用户信息
  getUserInfo() {
    const that = this
    return new Promise((resolve, reject) => {
      wx.getStorage({           //获取当前用户信息
        key: 'userInfo',
        success: function (res) {
          // success
          if (res.data) {
            const user_info = res.data
            resolve(user_info)
          } else {
            that.autoLogin().then(user_info => {
              console.log("app.js, getUserInfo, autoLogin, success, userInfo:", user_info)
              resolve(user_info)
            }).catch(error => {
              console.log("my.js, onLoad, app.autoLogin, error:", error)
              reject(error)
            })
          }
        },
        fail: function () {
          // fail
          that.autoLogin().then(user_info => {
            console.log("app.js, getUserInfo, autoLogin, success, userInfo:", user_info)
            resolve(user_info)
          }).catch(error => {
            console.log("my.js, onLoad, app.autoLogin, error:", error)
            reject(error)
          })
        },
        complete: function () {
          // complete
        }
      })
    })
  }
})