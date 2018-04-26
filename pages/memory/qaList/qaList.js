
import { JSON_ROOT_URL } from '../../../config/config'
import keyBy from '../../../lib/lodash.keyby/index'

Page({
  data:{
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数

    this.fetchQuestionList()
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
  },
  
  fetchQuestionList() {
    // const that = this
    // wx.request({
    //   url: `${JSON_ROOT_URL}/tree-qa.json`,
    //   method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
    //   // header: {}, // 设置请求的 header
    //   success: function (res) {
    //     // success
    //     const response_data = res.data
    //     if (response_data && response_data.questions) {
    //       const question_list = response_data.questions

    //       question_list.map((question, i) => {
    //         question.id = i
    //       })

    //       const questions = keyBy(question_list, 'id')

    //       wx.setStorage({
    //         key: 'questionList',
    //         data: question_list
    //       })

    //       wx.setStorage({
    //         key: 'questions',
    //         data: questions
    //       })

    //       that.setData({
    //         questionList: question_list
    //       })
    //     }
    //   },
    //   fail: function () {
    //     // fail
    //   },
    //   complete: function () {
    //     // complete
    //   }
    // })
  }
})