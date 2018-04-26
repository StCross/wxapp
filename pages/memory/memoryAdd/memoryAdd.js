
const { uploadToken, addEvent } = require('../../../action/fetch');
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
    const that = this
    const perId = options.personId;
    that.setData({
      personId: perId
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
  // 拍老物件
  bindOld() {
    const that = this
    const { imgArr } = this.data,
      imgLen = imgArr.length;
    // console.log(imgLen)
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
    const that =this
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
  // startRecode(isRecord = true) {
  //   const that = this;
  //   const { userInfo, audioArr, audioId } = this.data,
  //     token = userInfo.data.token,
  //     filesType = 3;

  //   const recorderManager = wx.getRecorderManager()
  //   recorderManager.onStart(() => {
  //     console.log('recorder start')
  //     const options = {
  //       duration: 5000,
  //       sampleRate: 44100,
  //       numberOfChannels: 1,
  //       encodeBitRate: 192000,
  //       format: 'mp3',
  //       frameSize: 50
  //     }
  //     recorderManager.start(options)
  //   })


  //   // if (!isRecord) {
  //   //   wx.showModal({
  //   //     title: '提示',
  //   //     content: '开始新录音前请删除之前的录音。',
  //   //     showCancel: false
  //   //   })
  //   // } else {

  //   // }
  // },
  // 录音结束
  // endRecode() {
  //   const that = this;
    
  // },
  // 本地上传图片
  bindLoccal() {
    this.showMenu()
    const that = this
    const {imgArr} = this.data,
      imgLen = imgArr.length;
    var imgLimit;
    if (imgLen > 8) {
      imgLimit = false
      that.localUploadImg(imgLimit)
    } else {
      imgLimit = true
      that.localUploadImg(imgLimit)
    } 
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
    this.showMenu()
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
                console.log(that.data)
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
    let { imgArr, imgIdArr, isChange, videoArr, description} = this.data
    const index = e.currentTarget.dataset.index
    imgArr.splice(index, 1)
    imgIdArr.splice(index, 1)
    this.setData({
      imgArr: imgArr,
      imgIdArr: imgIdArr
    })
    // console.log(this.data)
    if (imgArr.length > 0 || videoArr.length > 0 || description) { 
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
    let { videoArr, videoId, isChange, imgArr, description } = this.data
    const index = e.currentTarget.dataset.index
    videoArr.splice(index, 1)
    videoId.splice(index, 1)
    this.setData({
      videoArr: videoArr,
      videoId: videoId
    })
    // console.log(this.data)
    if (imgArr.length > 0 || videoArr.length > 0 || description) {
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
    let { imgArr, videoArr, isChange } = this.data
    const answerInput = e.detail.value;
    // const strLenth = answerInput.length;
    this.setData({
      description: answerInput
      // strLenth: 500-strLenth
    })
    if (answerInput || imgArr.length > 0 || videoArr.length > 0) {
      this.setData({
        isChange: true
      })
    } else {
      this.setData({
        isChange: false
      })
    }
  },
  initInput(e) {
    const titleInput = e.detail.value;
    this.setData({
      titleInput: titleInput
    })
  },
  bindDateChange(e) {
    const etime = e.detail.value
    this.setData({
      date: etime,
      isdateChange: true
    })
  },
  // 所有资源id
  recodeId() {
    let idArray = [];
    const { videoId, imgIdArr } = this.data;  // 录音id暂时不添加
    idArray = idArray.concat(imgIdArr, videoId)
    // console.log(idArray)
    this.setData({
      idArray: idArray
    })
    wx.setStorageSync('idarr', idArray)
  },
  formSubmit(e) {
    this.recodeId();
    const that = this;
    that.setData({
      bcloading: true
    })
    const { personId, userInfo, titleInput, description, date, idArray } = this.data;
    const token = userInfo.data.token;
    if(!token) return
    that.personEvent(personId, token, titleInput, description, date, idArray)
  },
  // 添加事件
  personEvent(perId, uToken, eTitle, eContent, eDate, resouceid) {
    const that = this;
    addEvent(perId, uToken, eTitle, eContent, eDate, resouceid)
      .then(resdata => {
        // console.log("add event success res:", resdata)
        broadcast.fire("addeventsuccess")
        wx.navigateBack({
          delta: 1,
          success: function (res) {

          }
        })
        that.setData({
          bcloading: false
        })
      }).catch(err => {
        console.log(" add event create fail")
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
    const { personId, userInfo, titleInput, description, date, idArray, shareInput } = this.data,
      token = userInfo.data.token;
    return {
      // title: `${nickname}向你分享岁月回想录`,
      path: `/pages/memory/addmemoryShare/addmemoryShare?personId=${personId}&titleInput=${titleInput}&date=${date}&shareInput=${shareInput}`,
      success: function (res) {
        // success
        that.setData({
          bcloading: true
        })
        if (!token) return
        that.personEvent(personId, token, titleInput, description, date, idArray)
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
    let { personInfo, showShare, titleInput, description, date } = this.data,
      sname = personInfo.surname,
      name = personInfo.name
    let sharetitle = `我想知道${personInfo.surname + personInfo.name + titleInput}`
    wx.setStorageSync("descripts", description);
    if (titleInput && date) {
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
    // console.log(this.data)
  }
})