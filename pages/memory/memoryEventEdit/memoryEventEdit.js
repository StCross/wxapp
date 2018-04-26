
const { uploadToken, updateEvent, otherShareTime } = require('../../../action/fetch');
const qiniuUploader = require("../../../utils/qiniuUploader");
const broadcast = require('../../../lib/broadcast');
Page({
  data: {
    isdateChange: false,
    isChange: false,
    imgArr: [],
    imgIdArr: [],
    videoArr: [],
    videoId: [],
    audioArr: [],
    audioId: [],
    showmenu: false,
    showShare: false,
    defaultUrl: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg"
  },
  onLoad(options) {
    const that = this;
    const personId = options.personId;
    const eventId = options.eventId;
    let { isChange, imgArr, imgIdArr, videoArr, videoId, audioArr, audioId } = this.data
    const src = `https://www.sysshu.com/timeline/invite/${eventId}`
    that.setData({
      isChange: true,
      personId: personId,
      eventId: eventId,
      src: src
    })
    wx.getStorage({
      key: 'eventInfo',
      success: function (res) {
        that.setData({
          jzloading: true
        })
        const title = res.data.eventTitle;
        const content = res.data.eventContent;
        const evdate = res.data.eventDate.substring(0, 10);
        const resouceIds = res.data.list;
        const idDatas = resouceIds.map(v => {
          // console.log(v)
          if (v.fileType == 1) {
            videoArr.push(v.urlFrameCapture)
            videoId.push(v.id)
            that.setData({
              videoArr: videoArr,
              videoId: videoId
            })
          } if (v.fileType == 2) {
            imgArr.push(v.urlFrameCapture)
            imgIdArr.push(v.id)
            that.setData({
              imgArr: imgArr,
              imgIdArr: imgIdArr
            })
          } if (v.fileType == 3) {
            audioArr.push(v.urlFrameCapture)
            audioId.push(v.id)
            that.setData({
              audioArr: audioArr,
              audioId: audioId
            })
          }
        })
        // success
        that.setData({
          eventInfo: res.data,
          initTitle: title,
          initContent: content,
          eventdate: evdate,
          souceIds: resouceIds,
          jzloading: false
        })
      }
    })
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        // success
        that.setData({
          userInfo: res.data
        })
      }
    })
    wx.getStorage({
      key: 'personInfo',
      success: function (res) {
        // success
        that.setData({
          personInfo: res.data
        })
      }
    })
    let now_date = new Date();
    const now_month = now_date.getMonth() + 1
    now_date = now_date.getFullYear() + "-" + now_month + "-" + now_date.getDate();
    that.setData({
      now_date: now_date
    })
    // 隐藏分享按钮
    wx.hideShareMenu()
  },
  onReady() {
    // console.log("app, onReady")
  },
  // 拍老物件
  bindOld() {
    const that = this
    const { imgArr } = this.data,
      imgLen = imgArr.length;
    console.log(imgLen)
    var imgLimit;
    if (imgLen > 8) {
      imgLimit = false
      that.uploadOldImg(imgLimit)
    } else {
      imgLimit = true
      that.uploadOldImg(imgLimit)
    }
  },
  uploadOldImg(imgLimit = true) {
    const that = this;
    const { userInfo, imgArr, imgIdArr } = this.data,
      token = userInfo.data.token,
      filetype = 2;
    if (!imgLimit) {
      wx.showModal({
        title: '提示',
        content: '最多上传9张图片！',
        showCancel: false
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['camera'], // 使用相机
        success: function (res) {
          // success
          const filePath = res.tempFilePaths[0],
            imgtype = filePath.slice(-3);
          imgArr.push(filePath)
          imgArr.reverse()
          that.setData({
            imgArr: imgArr
          })
          uploadToken(token, imgtype, filetype).then(resdata => {  // 获取七牛token
            const upToken = resdata.data.uploadToken,
              upKey = resdata.data.uploadKey;
            // 上传七牛
            that.setData({
              loading: true
            })
            qiniuUploader.upload(filePath, (res) => {
              const localImgURL = res.data.urlToken,
                Id = res.data.id;
              imgIdArr.push(Id)
              that.setData({
                imgIdArr: imgIdArr,
                loading: false,
                isChange: true
              })
            }, (error) => {
              console.log('error: ' + error);
            }, {
                region: 'QN',
                key: upKey,
                domain: 'bzkdlkaf.bkt.clouddn.com', // bucket 域名，下载资源时用到。
                uptoken: upToken // 由其他程序生成七牛 uptoken
              })
          })
        },
        fail: function () {
          // fail
        },
        complete: function () {
          // complete
        }
      })
    }
  },
  // 录像
  binShoot() {
    const that = this
    const { videoArr } = this.data,
      len = videoArr.length;
    var isShoot;
    if (len > 0) {
      isShoot = false
      that.uploadVideo(isShoot)
    } else {
      isShoot = true
      that.uploadVideo(isShoot)
    }
  },
  uploadVideo(isShoot = true) {
    const that = this;
    const { userInfo, videoArr, videoId } = this.data,
      token = userInfo.data.token,
      filesType = 1;
    if (!isShoot) {
      wx.showModal({
        title: '提示',
        content: '最多只能上传一个视频！',
        showCancel: false
      })
    } else {
      wx.chooseVideo({
        sourceType: ['camera'],
        compressed: true,
        maxDuration: 60,
        camera: 'back',
        success: function (res) {
          console.log(res)
          // success
          const duration = res.duration
          const filePath = res.tempFilePath,
            fmPath = res.thumbTempFilePath,
            videotype = filePath.slice(-3);
          if (duration > 60) {
            wx.showModal({
              title: '提示',
              content: '录像时长不能超过60s！',
              showCancel: false
            })
          } else {
            uploadToken(token, videotype, filesType).then(resdata => {  // 获取七牛token
              const upToken = resdata.data.uploadToken,
                upKey = resdata.data.uploadKey;
              // 上传七牛
              that.setData({
                loading: true
              })
              qiniuUploader.upload(filePath, (res) => {
                // console.log(res)
                const videoSrc = res.data.urlToken,
                  newSrc = videoSrc + '&.mp4',
                  vfm = res.data.urlFrameCapture,
                  Id = res.data.id;
                videoArr.push(vfm)
                videoId.push(Id)
                that.setData({
                  loading: false,
                  videoArr: videoArr,
                  videoId: videoId,
                  isChange: true
                });
              }, (error) => {
                console.log('error: ' + error);
              }, {
                  region: 'QN',
                  key: upKey,
                  domain: 'bzkdlkaf.bkt.clouddn.com', // bucket 域名，下载资源时用到。
                  uptoken: upToken // 由其他程序生成七牛 uptoken
                })
            })
          }
        },
        fail: function () {
          // fail
        },
        complete: function () {
          // complete
        }
      })
    }
  },
  // 录音
  // bindRecord() {
  //   const that = this
  //   const { audioArr } = this.data,
  //     len = audioArr.length;
  //   var isRecord;
  //   if (len > 0) {
  //     isRecord = false
  //     that.uploadRecord(isRecord)
  //   } else {
  //     isRecord = true
  //     that.uploadRecord(isRecord)
  //   }
  // },
  // uploadRecord(isRecord = true) {
  //   const that = this;
  //   const { userInfo, audioArr, audioId } = this.data,
  //     token = userInfo.data.token,
  //     filesType = 3;
  //   if (!isRecord) {
  //     wx.showModal({
  //       title: '提示',
  //       content: '开始新录音前请删除之前的录音。',
  //       showCancel: false
  //     })
  //   } else {
  //     wx.startRecord({
  //       success: function (res) {
  //         console.log(res)
  //         // success
  //         const filePath = res.tempFilePath,
  //           audiotype = filePath.slice(-4);
  //         uploadToken(token, audiotype, filesType).then(resdata => {  // 获取七牛token
  //           const upToken = resdata.data.uploadToken,
  //             upKey = resdata.data.uploadKey;
  //           // 上传七牛
  //           that.setData({
  //             loading: true
  //           })
  //           qiniuUploader.upload(filePath, (res) => {
  //             console.log(res)
  //             const recodeUrl = res.data.urlToken,
  //               Id = res.data.id;
  //             // console.log(res)
  //             that.setData({
  //               loading: false,
  //               recordId: Id,
  //               recodeUrl: recodeUrl,
  //               isChange: true
  //             });
  //           }, (error) => {
  //             console.log('error: ' + error);
  //           }, {
  //               region: 'QN',
  //               key: upKey,
  //               domain: 'bzkdlkaf.bkt.clouddn.com', // bucket 域名，下载资源时用到。
  //               uptoken: upToken // 由其他程序生成七牛 uptoken
  //             })
  //         })
  //       },
  //       fail: function () {
  //         // fail
  //       }
  //     }),
  //       // 录音结束
  //       setTimeout(function () {
  //         //结束录音  
  //         wx.stopRecord()
  //       }, 5000)
  //   }
  // },
  // 本地上传图片
  bindLoccal() {
    const that = this
    const { imgArr } = this.data,
      imgLen = imgArr.length;
    var imgLimit;
    if (imgLen > 8) {
      imgLimit = false
      that.localUploadImg(imgLimit)
    } else {
      imgLimit = true
      that.localUploadImg(imgLimit)
    }
    this.showMenu()
  },
  localUploadImg(imgLimit = true) {
    const that = this;
    const { userInfo, imgArr, imgIdArr } = this.data,
      token = userInfo.data.token,
      filetype = 2;
    if (!imgLimit) {
      wx.showModal({
        title: '提示',
        content: '最多上传9张图片！',
        showCancel: false
      })
    } else {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album'], // 从相册选图
        success: function (res) {
          // success
          const filePath = res.tempFilePaths[0],
            imgtype = filePath.slice(-3);
          imgArr.push(filePath)
          imgArr.reverse()
          that.setData({
            imgArr: imgArr
          })
          uploadToken(token, imgtype, filetype).then(resdata => {  // 获取七牛token
            const upToken = resdata.data.uploadToken,
              upKey = resdata.data.uploadKey;
            // 上传七牛
            that.setData({
              loading: true
            })
            qiniuUploader.upload(filePath, (res) => {
              const localImgURL = res.data.urlToken,
                Id = res.data.id;
              imgIdArr.push(Id)
              that.setData({
                imgIdArr: imgIdArr,
                loading: false,
                isChange: true
              })
            }, (error) => {
              console.log('error: ' + error);
            }, {
                region: 'QN',
                key: upKey,
                domain: 'bzkdlkaf.bkt.clouddn.com', // bucket 域名，下载资源时用到。
                uptoken: upToken // 由其他程序生成七牛 uptoken
              })
          })
        },
        fail: function () {
          // fail
        },
        complete: function () {
          // complete
        }
      })
    }
  },
  // 本地上传视频
  binLocalShoot() {
    const that = this
    const { videoArr } = this.data,
      len = videoArr.length;
    var isLoaclV;
    if (len > 0) {
      isLoaclV = false
      that.uploadLocalVideo(isLoaclV)
    } else {
      isLoaclV = true
      that.uploadLocalVideo(isLoaclV)
    }
    this.showMenu()
  },
  uploadLocalVideo(isLoaclV = true) {
    const that = this;
    const { userInfo, videoArr, videoId } = this.data,
      token = userInfo.data.token,
      filesType = 1;
    if (!isLoaclV) {
      wx.showModal({
        title: '提示',
        content: '最多只能上传一个视频！',
        showCancel: false
      })
    } else {
      wx.chooseVideo({
        sourceType: ['album'], // 从相册选择
        compressed: true,
        maxDuration: 60,
        camera: 'back',
        success: function (res) {
          console.log(res)
          // success
          const duration = res.duration
          const filePath = res.tempFilePath,
            fmPath = res.thumbTempFilePath,
            videotype = filePath.slice(-3);
          if (duration > 60) {
            wx.showModal({
              title: '提示',
              content: '录像时长不能超过60s！',
              showCancel: false
            })
          } else {
            uploadToken(token, videotype, filesType).then(resdata => {  // 获取七牛token
              const upToken = resdata.data.uploadToken,
                upKey = resdata.data.uploadKey;
              // 上传七牛
              that.setData({
                loading: true
              })
              qiniuUploader.upload(filePath, (res) => {
                // console.log(res)
                const videoSrc = res.data.urlToken,
                  newSrc = videoSrc + '&.mp4',
                  vfm = res.data.urlFrameCapture,
                  Id = res.data.id;
                videoArr.push(vfm)
                videoId.push(Id)
                that.setData({
                  loading: false,
                  videoArr: videoArr,
                  videoId: videoId,
                  isChange: true
                });
              }, (error) => {
                console.log('error: ' + error);
              }, {
                  region: 'QN',
                  key: upKey,
                  domain: 'bzkdlkaf.bkt.clouddn.com', // bucket 域名，下载资源时用到。
                  uptoken: upToken // 由其他程序生成七牛 uptoken
                })
            })
          }
        },
        fail: function () {
          // fail
        },
        complete: function () {
          // complete
        }
      })
    }
  },
  // 删除图片
  deleteImg(e) {
    let { imgArr, imgIdArr, isChange, videoArr, initContent } = this.data
    const index = e.currentTarget.dataset.index
    imgArr.splice(index, 1)
    imgIdArr.splice(index, 1)
    this.setData({
      imgArr: imgArr,
      imgIdArr: imgIdArr
    })
    // console.log(this.data)
    if (imgArr.length > 0 || videoArr.length > 0 || initContent) {
      this.setData({
        isChange: true
      })
    } else {
      this.setData({
        isChange: false
      })
    }
  },
  // 删除视频
  deleteVedio(e) {
    let { videoArr, videoId, isChange, imgArr, initContent } = this.data
    const index = e.currentTarget.dataset.index
    videoArr.splice(index, 1)
    videoId.splice(index, 1)
    this.setData({
      videoArr: videoArr,
      videoId: videoId
    })
    // console.log(this.data)
    if (imgArr.length > 0 || videoArr.length > 0 || initContent) {
      this.setData({
        isChange: true
      })
    } else {
      this.setData({
        isChange: false
      })
    }
  },
  answerInput(e) {
    let { initContent, imgArr, videoArr, isChange } = this.data
    initContent = e.detail.value;
    this.setData({
      initContent: initContent
    })
    if (initContent || imgArr.length > 0 || videoArr.length > 0) {
      this.setData({
        isChange: true
      })
    } else {
      this.setData({
        isChange: false
      })
    }
  },
  titleInput(e) {
    let { initTitle } = this.data
    initTitle = e.detail.value;
    this.setData({
      initTitle: initTitle
    })
    // if (initTitle || initContent || imgArr.length > 0 || videoArr.length > 0) {
    //   this.setData({
    //     isChange: true
    //   })
    // } else {
    //   this.setData({
    //     isChange: false
    //   })
    // }
  },
  bindDateChange(e) {
    const etime = e.detail.value
    console.log(etime)
    this.setData({
      date: etime
    })
  },
  // 所有资源id
  recodeId() {
    let idArray = [];
    const { videoId, imgIdArr, audioId } = this.data;  
    idArray = idArray.concat(imgIdArr, videoId, audioId)
    console.log(idArray)
    this.setData({
      idArray: idArray
    })
  },
  formSubmit(e) {
    const that = this;
    that.setData({
      bcloading: true
    })
    this.recodeId();
    const { userInfo, personId, eventId, eventInfo, initTitle, initContent, date, idArray } = this.data;
    // console.log(this.data)
    const token = userInfo.data.token;
    const eventType = eventInfo.specialType;
    const eventDate = eventInfo.eventDate.substring(0, 10),
      newDate = date ? date : eventDate;
    const dateType = eventInfo.eventDateType;
    if (!token) return
    that.updatePerEvent(token, personId, eventId, initTitle, eventType, initContent, newDate, dateType, idArray)
  },
  // 更新事件
  updatePerEvent(uptoken, personId, eventId, eventTitle, specialType, Content, Date, DateType, resouces) {
    const that = this;
    updateEvent(uptoken, personId, eventId, eventTitle, specialType, Content, Date, DateType, resouces)
      .then(resdata => {
        // console.log("add event success res:", resdata)
        broadcast.fire("puteventsuccess")
        wx.navigateBack({
          delta: 1,
          success: function (res) {
          }
        })
        that.setData({
          bcloading: false
        })
      }).catch(err => {
        console.log("update event create fail")
        that.setData({
          bcloading: false
        })
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
    const { eventInfo, src, personId, eventId, userInfo, initTitle, initContent, date, idArray, shareInput } = this.data,
      token = userInfo.data.token;
    const eventType = eventInfo.specialType;
    const eventDate = eventInfo.eventDate.substring(0, 10),
      newDate = date ? date : eventDate;
    const dateType = eventInfo.eventDateType;
    // console.log(shareInput)
    otherShareTime(eventId, shareInput, token).then(res_data => { // 更新时间戳

    })
    return {
      // title: `${nickname}向你分享岁月回想录`,
      path: `/pages/memory/memoryShareDetail/memoryShareDetail?src=${src}`,
      success: function (res) {
        // success
        that.setData({
          bcloading: true
        })
        if (!token) return
        that.updatePerEvent(token, personId, eventId, initTitle, eventType, initContent, newDate, dateType, idArray)
        that.showSharebox()
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  // 收集弹窗
  showSharebox() {
    this.recodeId()
    let { personInfo, showShare, initTitle, date } = this.data,
      sname = personInfo.surname,
      name = personInfo.name;
    let sharetitle = `我想知道${personInfo.surname + personInfo.name + initTitle}`
    if (initTitle) {
      if (!showShare) {
        this.setData({
          shareInput: sharetitle,
          showShare: true
        })
      } else {
        this.setData({
          shareInput: sharetitle,
          showShare: false
        })
      }
    } else {
      wx.showModal({
        title: '提示',
        content: '请填写回忆标题和时间',
        showCancel: false
      })
    }
  },
  // 显示菜单
  showMenu() {
    const { showmenu } = this.data
    if (!showmenu) {
      this.setData({
        showmenu: true
      })
    } else {
      this.setData({
        showmenu: false
      })
    }
  },
  onShow() {
    // console.log("app, onShow")
  }
})