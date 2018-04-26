const { addEvent, otherShareTime} = require('../../../action/fetch');
const broadcast = require('../../../lib/broadcast');

Page({
  data: {
    src:''
  },
  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    const that = this
    let { src } = this.data
    const personId = options.personId
    const titleInput = options.titleInput
    const date = options.date
    const description = wx.getStorageSync("descripts")
    const idArray = wx.getStorageSync("idarr")
    const shareInput = options.shareInput
    wx.getStorage({
      key: 'userInfo',
      success: function(res) {
        that.setData({
          loading: true
        })
        const token = res.data.data.token
        // 获取eventId
        addEvent(personId, token, titleInput, description, date, idArray).then(resdata => {
          // console.log(resdata)
          broadcast.fire("addeventsuccess")
          const eventId = resdata.eventId
          const src = `https://www.sysshu.com/timeline/invite/${eventId}`
          otherShareTime(eventId, shareInput, token).then(res_data => { // 更新时间戳
            that.setData({
              src: src,
              loading: false
            })
          })
        })
      },
    })
  },
  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成
  },
  onShow: function () {
    // 生命周期函数--监听页面显示
  },
  onHide: function () {
    // 生命周期函数--监听页面隐藏
  },
  onUnload: function () {
    // 生命周期函数--监听页面卸载
  }
})