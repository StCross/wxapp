// pages/memory/memoryGuide/memoryGuide.js
const { findMemoirList, deleteMemoir } = require('../../../action/fetch')
const broadcast = require('../../../lib/broadcast')
const app = getApp()
Page({
  data: {
    pageCont: 0,
    memory_list: [],
    defaultBg: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg",
    already_list: []
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const that = this;
    app.getUserInfo().then(user_info => {
      // console.log(user_info)
      const token = user_info.data.token
      wx.getStorage({
        key: 'memoryLists',
        success: function(res) {
          that.setData({
            memory_list: res.data
          })
        },
        fail: function() {
          that.setData({
            loading: true
          })
          that.getMemoirList(token, true)
        }
      })
      that.setData({
        accessToken: token
      })
    }).catch(error => {
      console.log("memoryGuide.js, onLoad, app.getUserInfo, error:", error)
    })
    //  broadcast.on
    broadcast.on("memory_add_success", () => {
      console.log("memory_add_success")
      that.onRefreshPage()
    })
    broadcast.on("memory_delete_success", () => {
      that.onRefreshPage()
    })
    broadcast.on("addeventsuccess", () => {
      that.onRefreshPage()
    })
    broadcast.on("deleteeventsuccess", () => {
      that.onRefreshPage()
    })
    broadcast.on("memory_update_success", () => {
      console.log("memory_update_success")
      that.onRefreshPage()
    })
  },
  onReachBottom: function () {
    // 页面上拉触底事件的处理函数
  },
  onPullDownRefresh() {
    const that = this
    that.setData({
      loading: true,
      memory_list: []
    })
    that.getMemoirList(that.data.accessToken, true)
  },
  onRefreshPage() {
    const that = this
    that.setData({
      loading: true,
      memory_list: []
    })
    that.getMemoirList(that.data.accessToken, true)
  },
  getMemoirList(Token, is_append = false) {
    const that = this,
    accessToken = Token;
    findMemoirList(accessToken).then(res_data => { 
      const list = res_data.data
      console.log(list)
      that.setData({
        loading: false
      })
      that.setData({
        memory_list: list
      })
      wx.setStorage({
        key: 'memoryLists',
        data: list
      })
      if (is_append) {
        that.onReachBottom()
      }
      wx.stopPullDownRefresh()
    }).catch(error => {
      wx.stopPullDownRefresh()
      that.setData({
        loading: false
      })
    })
  },
  personClick(e) { 
    // console.log(e)
    const personId = e.currentTarget.dataset.id;
    const perBirth = e.currentTarget.dataset.year,
      newBirth = perBirth.substring(0, 4)
    wx.navigateTo({
      url: `../memoryLine/memoryLine?personId=${personId}&newBirth=${newBirth}`,
      success: function (res) {
        // success
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
  },
  // 跳转创建页
  entryAddTree() {
    const that = this;
    wx.navigateTo({
      url: '../addnewMemory/addnewMemory',
      success: function (res) {
        // success
      }
    })
  },
  // 长按
  onlangDelete(e) {
    const that = this
    const personid = e.currentTarget.dataset.id
    wx.showModal({
      title: '是否确定删除？',
      content: '',
      cancelColor: '#97B82B',
      confirmColor: '#97B82B',
      success: function (res) {
        if (res.confirm) {
          that.deleteMemory(personid)
        }
      }
    })
  },
  // 删除回想录
  deleteMemory(Id) {
    const { accessToken } = this.data
    deleteMemoir(Id, accessToken).then(res => {
      console.log("delete success.")
      broadcast.fire('memory_delete_success')
    }).catch(err => {
      console.log("delete fail.", err)
    })
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})