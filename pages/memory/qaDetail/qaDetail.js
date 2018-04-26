Page({
  data:{
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    const question_id = options.questionId
    const that = this

    if (!question_id) {
      return
    }

    wx.getStorage({
      key: 'questions',
      success: function (res) {
        if (res && res.data) {
          const questions = res.data
          const question = questions[question_id]

          if (question) {
            that.setData({
              question: question
            })
          }
        }
      }
    })
  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})