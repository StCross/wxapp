
const { getEventListMemoir, getPersonInfo, updateShareTime } = require('../../../action/fetch')
const broadcast = require('../../../lib/broadcast')
const { formatSeconds } = require('../../../utils/formatSeconds')
const app = getApp()
Page({
  data: {
    birthYear: '',
    pageCont: 0,
    persontx: '',
    personfm: '',
    eventLists: [],
    defaultCover: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg"
  },
  onLoad: function (options) {
    // console.log(this.data)
    // 生命周期函数--监听页面加载
    const that = this
    const Id = options.personId
    const pyear = options.newBirth
    const src = `https://sit.sysshu.com/timeline/${Id}`
    that.setData({
      shownick: false,
      memoryId: Id,
      birthyear: pyear,
      src: src
    })
    wx.getStorage({
      key: 'userInfo',
      success: function(res) {
        const token = res.data.data.token
        wx.getStorage({
          key: 'eventLists',
          success: function(res) {
            let oldId = res.data[0].personId
            if (oldId == Id) {
              that.setData({
                eventLists: res.data
              })
              wx.getStorage({
                key: 'personInfo',
                success: function(res) {
                  const tx = res.data.resource.urlFrameCapture,
                    fm = res.data.fmResource.urlFrameCapture
                  that.setData({
                    perInfo: res.data,
                    shownick: true,
                    persontx: tx,
                    personfm: fm
                  })
                }
              })
            } else {
              that.setData({
                loading: true
              })
              that.getPerInfo(Id, token)
              that.GetMemoryEvent(Id, token)
            }
          },
          fail: function() {
            that.setData({
              loading: true
            })
            that.getPerInfo(Id, token)
            that.GetMemoryEvent(Id, token)
          }
        })
        that.setData({
          userInfo: res.data
        })
      }
    })
    broadcast.on("puteventsuccess", () => {
      console.log("puteventsuccess")
      that.onRefreshPage()
    })
    broadcast.on("addeventsuccess", () => {
      console.log("addeventsuccess")
      that.onRefreshPage()
    })
    broadcast.on("deleteeventsuccess", () => {
      console.log("deleteeventsuccess")
      that.onRefreshPage()
    })
    broadcast.on("memory_update_success", () => {
      console.log("memory_update_success")
      that.onPersonInfo()
    })
    broadcast.on("upmodeleventsuccess", () => {
      console.log("upmodeleventsuccess")
      that.onRefreshPage()
    })
    broadcast.on("addmemoryQa_success", () => {
      console.log("addmemoryQa_success")
      that.onRefreshPage()
    })
    // broadcast.on("token_refresh_success", (user_info) => {
    //   console.log(user_info)
    //   const access_token = user_info.data.token
    //   const user_id = user_info.data.userId
    //   that.setData({
    //     userInfo: user_info
    //   })
    //   that.GetMemoryEvent(access_token, memoryId)
    // })
  },
  // getEvent(memoryId, token) {
  //   const that = this;
  //   app.getUserInfo().then(resdata => {
  //     console.log(resdata)
  //     const access_token = resdata.data.token;
  //     const memoryId = that.data.memoryId;
  //     that.getPerInfo(memoryId, access_token)
  //     that.GetMemoryEvent(memoryId, access_token)
  //   }).catch(error => {
  //     console.log("line.js, onLoad, app.getUserInfo, error:", error)
  //   })
  // },
  onPersonInfo() {
    this.setData({
      loading: true
    })
    const that = this
    const { memoryId, userInfo } = this.data,
      token = userInfo.data.token;
    that.getPerInfo(memoryId, token)
  },
  onPullDownRefresh: function () {
    const that = this
    that.setData({
      loading: true,
      eventLists: []
    })
    that.onRefreshPage()
  },
  onRefreshPage() {
    const that = this
    that.setData({
      loading: true,
      eventLists: []
    })
    const { userInfo } = this.data;
    const token = userInfo.data.token;
    const perId = that.data.memoryId;
    that.getPerInfo(perId, token)
    that.GetMemoryEvent(perId, token)
  },
  GetMemoryEvent: function (personId, access_token) {
    const that = this
    if (!personId || !access_token) {
      return
    }
    getEventListMemoir(personId, access_token)
      .then(resData => {
        // console.log(resData)
        // 处理事件标题、日期、文本
        const Datelen = resData.length
        const { birthyear } = this.data
        const datas = resData.map(v => {
          v.eventInfo.resources = v.resources
          v.eventInfo.eventType = +v.eventInfo.eventType
          return v.eventInfo
        }).map((v, index) => {
          // console.log(v)
          v.startYear = v.eventDate.substring(0, 4)
          v.startMonth = v.eventDate.substring(5, 7)
          v.startDay = v.eventDate.substring(8, 10)
          v.detailDate = v.startYear + "年" + v.startMonth + "月" + v.startDay + "日"
          v.age = v.startYear - birthyear
          if (v.age === 0) {
            v.ageText = '出生'
          }
          if (v.age > 0) {
            v.ageText = v.age
          }
          if (v.resources.length > 4) {
            v.count = v.resources.length - 4
          } else {
            v.count = ''
          }
          if (v.resources.length === 0) {
            v.reType = 1
          } else {
            const video = v.resources.filter(items => items.fileType === 1)
            const audio = v.resources.filter(items => items.fileType === 3)
            const image = v.resources.filter(items => items.fileType === 2)
            v.reList = [].concat(video, audio, image)
            v.reListLength = v.reList.length
            if (v.reListLength > 4) {
              v.reList = v.reList.slice(0, 4)
              v.reOtherLength = v.reListLength - 4
            }
            v.reType = 5
            if ((video.length !== 0 || image.length !== 0) && audio.length === 1) {
              let moreaudio = audio[0].duration
              v.moreaudio = formatSeconds(moreaudio)     
            }
            if (video.length === 1 && audio.length === 0 && image.length === 0) {
              v.reType = 2
            }
            if (video.length === 0 && audio.length === 1 && image.length === 0) {
              v.reType = 3
              let onlyaudio = audio[0].duration
              v.onlyaudio = formatSeconds(onlyaudio)
            }
            if (video.length === 0 && audio.length === 0 && image.length === 1) {
              v.reType = 4
            }
          }
          const title = v.eventTitle
          v.newEventTitle = title.length > 12 ? title.substring(0, 12) + "..." : title
          const contents = v.eventContent
          if (contents) {
            v.newContent = contents.length > 16 ? contents.substring(0, 16) + "..." : contents
          }
          return v
        })
        // console.log(datas)
        that.setData({
          eventLists: datas,
          loading: false
        })
        wx.setStorage({
          key: 'eventLists',
          data: datas
        })
        wx.stopPullDownRefresh()
      })
      .catch(error => {
        wx.stopPullDownRefresh()
        that.setData({
          loading: false
        })
      })
  },
  getPerInfo(personId, access_token) {
    // console.log(this.data)
    const that = this;
    const { persontx, personfm, shownick } = this.data
    if (!personId || !access_token) {
      return
    }
    getPersonInfo(personId, access_token).then(resdata => {
      // console.log(resdata)
      const tx = resdata.resource.urlFrameCapture
      const fm = resdata.fmResource.urlFrameCapture
      const birth = resdata.birthday
      const mewBirth = birth.substring(0, 10)
      const birthArr = mewBirth.split("-")
      // const birthyear = birth.substring(0, 4)
      const birthDate = {
        "year": birthArr[0],
        "month": birthArr[1],
        "day": birthArr[2]
      }
      that.setData({
        perInfo: resdata,
        shownick: true,
        persontx: tx,
        personfm: fm,
        loading: false
      })
      wx.setStorage({
        key: "personInfo",
        data: resdata
      })
      wx.setStorageSync('oldAvatarId', resdata.resource.id)
      wx.setStorageSync('oldfmImgId', resdata.fmResource.id)
      wx.stopPullDownRefresh()
    }).catch(error => {
      wx.stopPullDownRefresh()
      that.setData({
        loading: false
      })
    })
  },
  // 跳转个人设置
  enterInfoEdit() {
    const Id = this.data.memoryId;
    wx.navigateTo({
      url: `../memorySet/memorySet?memoryId=${Id}`,
      success: function (res) {
        // success
      }
    })
  },
  // 跳转编辑页
  eventEdit(e) {
    const that = this;
    const eventId = e.currentTarget.dataset.eventid;
    const personid = that.data.memoryId;
    // console.log(eventId, personid)
    wx.navigateTo({
      url: `../memoryModelEdit/memoryModelEdit?personId=${personid}&eventId=${eventId}`,
      success: function (res) {
        // success
      }
    })
  },
  // 详情
  eventClick(e) {
    const that = this;
    const eventId = e.currentTarget.dataset.eventid;
    const personid = that.data.memoryId;
    // console.log(eventId, personid)
    wx.navigateTo({
      url: `../memoryDetail/memoryDetail?personId=${personid}&eventId=${eventId}`,
      success: function (res) {
        // success
      }
    })
  },
  enterEventAdd() { // 添加事件
    const that = this
    const perId = that.data.memoryId;
    wx.navigateTo({
      url: `../memoryAdd/memoryAdd?personId=${perId}`,
      success: function (res) {
        // success
      }
    })
  },
  enterqa() { // 回忆问答
    const that = this
    const perId = that.data.memoryId;
    const { userInfo } = this.data,
      token = userInfo.data.token;
    wx.navigateTo({
      url: `../memoryQa/memoryQa?personId=${perId}`,
      success: function (res) {
        // success
      }
    })
  },
  onShareAppMessage: function (res) {    // 分享
    const { src } = this.data
    const { memoryId, perInfo, userInfo } = this.data,
      sname = perInfo.surname,
      name = perInfo.name,
      token = userInfo.data.token
    const title = `${sname + name}的回想录`
    updateShareTime(memoryId, title, token).then(res => {

    })
    return {
      // title: `${nickname}向你分享岁月回想录`,
      path: `/pages/memory/memoryShareLine/memoryShareLine?src=${src}`,
      success: function (res) {
        // success
      },
      fail: function (res) {

      }
    }
  },
  onReachBottom: function () {    // 上拉事件
    // const that = this
    // console.log("上拉加载...")
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
  },
})