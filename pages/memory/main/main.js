Page({
  data: {
    
  },
  onLoad: function (options) {

  },
  navigateTo(e){
    const to = e.currentTarget.dataset.to
    wx.navigateTo({
      url: to,
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
  },

})
