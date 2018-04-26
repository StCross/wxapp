// pages/memory/memoryDetail/memoryDetail.js
const { getEventInfo, deleteEvent, otherShareTime, getComments } = require('../../../action/fetch')
const broadcast = require('../../../lib/broadcast')
Page({
  data: {
    commlist: [],
    isVilevel: true,
    showShare: false,
    defaultUrl: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg"
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const personid = options.personId;
    const eventId = options.eventId;
    const that = this;
    const src = `https://www.sysshu.com/timeline/invite/${eventId}`
    that.setData({
      personid: personid,
      eventId: eventId,
      src: src
    })
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        // success
        const token = res.data.data.token;
        wx.getStorage({
          key: 'eventInfo',
          success: function(res) {
            const Id = res.data.eventId, 
              date = res.data.eventDate.substring(0, 10),
              data_arr = date.split('-'),
              istype = res.data.specialType == 1 ? true : false
            const eDate = {
              'year': data_arr[0],
              'month': data_arr[1],
              'day': data_arr[2]
            }
            if (Id == eventId) {
              that.setData({
                eventData: res.data,
                eventTime: eDate,
              })
              wx.getStorage({
                key: 'comments',
                success: function(res) {
                  // console.log(res)
                  const datas = res.data.map(v => {
                    let commdate = v.comment.createtime.substring(0, 10)
                    v.date = commdate.replace(/-/g, ".")
                    v.agree = v.comment.favourNum
                    return v
                  })
                  that.setData({
                    commlist: datas
                  })
                }
              })
            } else {
              that.setData({
                loading: true
              })
              that.getInfo(eventId, token)
              that.Comments(token, eventId)
            }
          },
          fail: function() {
            that.setData({
              loading: true
            })
            that.getInfo(eventId, token)
            that.Comments(token, eventId)
          }
        })
        that.setData({
          userInfo: res.data
        })
      }
    })
    broadcast.on("puteventsuccess", () => {
      console.log("puteventsuccess")
      that.ongetInfo()
    })
    wx.getStorage({
      key: 'personInfo',
      success: function (res) {
        that.setData({
          personInfo: res.data
        })
      }
    })
    wx.hideShareMenu()
  },
  ongetInfo() {
    const that = this;
    that.setData({
      loading: true
    })
    const { eventId, userInfo } = this.data
    const token = userInfo.data.token
    if (token) {
      that.getInfo(eventId, token)
    }
  },
  getInfo(eventId, Token) {
    const that = this
    if (!eventId || !Token) {
      return
    }
    getEventInfo(eventId, Token).then(resdata => {
      that.setData({
        loading: false
      })
      const date = resdata.eventDate.substring(0, 10),
        data_arr = date.split('-'),
        istype = resdata.specialType == 1 ? true : false
      const eDate = {
        'year': data_arr[0],
        'month': data_arr[1],
        'day': data_arr[2]
      }
      that.setData({
        eventData: resdata,
        eventTime: eDate
      })
      wx.setStorage({
        key: 'eventInfo',
        data: resdata
      })
    })
  },
  // 评论
  Comments(token, eventid) {
    const that = this
    getComments(token, eventid).then(res => {
      that.setData({
        loading: false
      })
      const datas = res.map(v => {
        let commdate = v.comment.createtime.substring(0, 10)
        v.date = commdate.replace(/-/g, ".")
        v.agree = v.comment.favourNum
        return v
      })
      // console.log(datas)
      that.setData({
        commlist: datas
      })
      wx.setStorage({
        key: 'comments',
        data: res
      })
      // const dataimg = res.map(i => {
      //   if (i.commentResources.length > 0) {
      //     i.commimgArr = i.commentResources
      //   } 
      //   return i.commimgArr
      // })
      // // console.log(dataimg)
      // that.setData({
      //   commimgArr: dataimg
      // })
    })
  },
  // 图片预览
  // previewImg(e) {
  //   const { commimgArr } = this.data
  //   const url = e.currentTarget.dataset.url
  //   wx.previewImage({
  //     current: url, // 当前显示图片的http链接
  //     urls: [url] // 需要预览的图片http链接列表
  //   })
  // },
  deleteEvent() {
    const that = this;
    const { personid, eventId, userInfo } = this.data;
    const access_token = userInfo.data.token;
    wx.showModal({
      content: '是否确定删除当前回忆！',
      cancelColor: '#97B82B',
      confirmColor: '#97B82B',
      success: function (res) {
        if (res.confirm) {
          // console.log('用户点击确定')
          deleteEvent(eventId, personid, access_token)
            .then(res_data => {
              broadcast.fire("deleteeventsuccess")
              wx.navigateBack({
                delta: 1,
                success: function (res) {
                  // success
                }
              })
            })
        }
      }
    })
  },
  editEvent(e) {
    const that = this;
    const personId = that.data.personid;
    const eventId = that.data.eventId;
    wx.navigateTo({
      url: `../memoryEventEdit/memoryEventEdit?personId=${personId}&eventId=${eventId}`,
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
  // 分享input
  bindShareIn(e) {
    let { shareInput } = this.data;
    shareInput = e.detail.value;
    this.setData({
      shareInput: shareInput
    })
  },
  // 收集回忆
  onShareAppMessage: function (res) {    // 分享
    const that = this
    const { src, eventId, userInfo, shareInput } = this.data,
      token = userInfo.data.token;
    otherShareTime(eventId, shareInput, token).then(res_data => { // 更新时间戳
    
    })
    return {
      // title: `${nickname}向你分享岁月回想录`,
      path: `/pages/memory/memoryShareDetail/memoryShareDetail?src=${src}`,
      success: function (res) {
        // success
        that.showSharebox()
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  // 收集弹窗
  showSharebox() {
    let { personInfo, showShare, isVilevel, eventData } = this.data,
      title = eventData.eventTitle,
      sname = personInfo.surname,
      name = personInfo.name
    let sharetitle = `我想知道${personInfo.surname + personInfo.name + title}`
    if (!showShare) {
      this.setData({
        shareInput: sharetitle,
        showShare: true,
        isVilevel: false,
      })
    } else {
      this.setData({
        shareInput: sharetitle,
        showShare: false,
        isVilevel: true
      })
    }
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