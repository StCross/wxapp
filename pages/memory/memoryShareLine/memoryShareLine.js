
Page({
  data: {
    src:''
  },
  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    const src = options.src 
    this.setData({
      src: src
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