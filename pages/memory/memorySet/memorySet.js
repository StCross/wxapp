const { updatePersonInfo, uploadToken, deleteMemoir } = require('../../../action/fetch');
const broadcast = require('../../../lib/broadcast');
const qiniuUploader = require("../../../utils/qiniuUploader");
Page({
  data: {
    date: "",
    isChange: false,
    defaultBg: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg",
    defaultAva: "../../../icon/person-image.png"
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const memoryId = options.memoryId;
    const that = this;
    that.setData({
      isloading: true,
      memoryId: memoryId
    })
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        // success
        that.setData({
          userInfo: res.data.data
        })
        const access_token = res.data.data.token
        wx.getStorage({
          key: 'personInfo',
          success: function (peres) {
            // success
            const defaultBg = that.data.defaultBg
            const defaultAva   = that.data.defaultAva 
            const perInfo = peres.data,
              sname = perInfo.surname,
              name = perInfo.name,
              birth = perInfo.birthday,
              newBirth = birth.substring(0, 10),
              resourceIdTx = perInfo.resource.id ? perInfo.resource.id : '',
              resourceIdFm = perInfo.fmResource.id ? perInfo.fmResource.id : '',
              fmUrl = perInfo.fmResource.urlFrameCapture ? perInfo.fmResource.urlFrameCapture : defaultBg,
              userAva = perInfo.resource.urlFrameCapture ? perInfo.resource.urlFrameCapture : defaultAva

            if (perInfo) {
              that.setData({
                sName: sname,
                Name: name,
                birthday: newBirth,
                fmUrl: fmUrl,
                avatar: userAva
              })
            }
            that.setData({
              isloading: false
            })
          }
        })
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
    // 处理事件的时间
    let now_date = new Date();
    const now_month = now_date.getMonth() + 1
    now_date = now_date.getFullYear() + "-" + now_month + "-" + now_date.getDate();
    that.setData({
      now_date: now_date
    })
  },
  updateAvatar() {
    const that = this;
    const { userInfo, avatarUrlLocal } = this.data,
      token = userInfo.token,
      avatarType = 2;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        // success
        const filePath = res.tempFilePaths[0],
          imgtype = filePath.slice(-3);
        uploadToken(token, imgtype, avatarType).then(resdata => {  // 获取七牛token
          const upToken = resdata.data.uploadToken,
            upKey = resdata.data.uploadKey;
          // 上传七牛
          that.setData({
            uploading: true
          })
          qiniuUploader.upload(filePath, (res) => {
            const imgURL = res.data.urlToken,
              Id = res.data.id;
            that.setData({
              uploading: false,
              isChange: true
            })
            wx.setStorageSync('newAvatarId', Id)
            const newAvatarId = wx.getStorageSync('newAvatarId')
            that.setData({
              newAvatar: newAvatarId
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
        that.setData({
          avatarUrlLocal: filePath
        })
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
  },
  updateBg() {
    const that = this;
    const { userInfo, bgUrl } = this.data,
      token = userInfo.token,
      bgType = 2;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        // success
        const filePath = res.tempFilePaths[0],
          imgtype = filePath.slice(-3);
        uploadToken(token, imgtype, bgType).then(resdata => {  // 获取七牛token
          const upToken = resdata.data.uploadToken,
            upKey = resdata.data.uploadKey;
          // 上传七牛
          that.setData({
            uploading: true
          })
          qiniuUploader.upload(filePath, (res) => {
            const imgURL = res.data.urlToken,
              Id = res.data.id;
            that.setData({
              uploading: false,
              isChange: true
            })
            wx.setStorageSync('newfmImgId', Id)
            const newfmImgId = wx.getStorageSync('newfmImgId')
            that.setData({
              newfmImg: newfmImgId
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
        that.setData({
          bgUrl: filePath
        })
      },
      fail: function () {
        // fail
      },
      complete: function () {
        // complete
      }
    })
  },
  formSubmit(e) {
    const that = this;
    that.setData({
      loading: true
    })
    const pId = this.data.memoryId; 
    const { userInfo, newAvatar, newfmImg, avatarUrlLocal, bgUrl } = this.data;
    const oldAvatar = wx.getStorageSync("oldAvatarId");
    const oldfmImg = wx.getStorageSync("oldfmImgId");
    const token = userInfo.token;
    const sName = e.detail.value.surname,
      Name = e.detail.value.name,
      birthday = that.data.birthday,
      birthyear = birthday.substring(0, 4);
    // 判断图片Id是否已更改
    const newResouceId = avatarUrlLocal ? newAvatar : oldAvatar,
      newfmResouce = bgUrl ? newfmImg : oldfmImg;
    // 修改
    that.updateInfo(pId, token, sName, Name, birthday, newResouceId, newfmResouce)  // 待改：到底怎样传id
  },
  updateInfo(perId, access_token, sunName, Name, birthday, avator, fmUrl) {
    const that = this
    const pId = this.data.memoryId
    if (!access_token || !perId) {
      return
    }
    updatePersonInfo(perId, access_token, sunName, Name, birthday, avator, fmUrl)
      .then(resData => {
        // const return_memory_info = resData
        that.setData({
          loading: false
        })
        broadcast.fire('memory_update_success', resData)
        wx.navigateBack({
          delta: 1,
          success: function (res) {

          }
        })
        // wx.redirectTo({
        //   url: `../memoryLine/memoryLine?personId=${pId}`,
        //   success: function (res) {
        //     success
        //   }
        // })
      })
      .catch(error => {
        console.log(error)
        that.setData({
          loading: false
        })
        wx.showModal({
          title: '修改回想录信息失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {
          }
        })
      })
  },
  onNicknamChange() {
    this.setData({
      isChange: true
    })
  },
  // onCancel() {
  //   wx.navigateBack({
  //     delta: 1, // 回退前 delta(默认为1) 页面
  //     success: function (res) {
  //       // success
  //     },
  //     fail: function () {
  //       // fail
  //     },
  //     complete: function () {
  //       // complete
  //     }
  //   })
  // },
  deleteConfirm() {
    const that = this;
    wx.showModal({
      content: '是否确定删除？',
      cancelColor: '#97B82B',
      confirmColor: '#97B82B',
      success: function (res) {
        // console.log(res)
        if (res.confirm) {
          that.deleteMemory()
        }
      }
    })
  },
  deleteMemory() {
    const that = this;
    const personId = that.data.memoryId;
    const access_token = that.data.userInfo.token;
    // console.log(personId, access_token)
    that.setData({
      loading: true
    })
    deleteMemoir(personId, access_token)
      .then(resData => {
        // console.log("删除回忆录成功");
        that.setData({
          loading: false
        })
        broadcast.fire('memory_delete_success')
        wx.navigateBack({
          delta: 2, // 回退前 delta(默认为1) 页面
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
      }).catch(err => {
        console.log("删除回忆录失败")
        that.setData({
          loading: false
        })
      })
  },
  onBirthDateChange(e) {
    const birth_date_str = e.detail.value
    if (birth_date_str) {
      this.setData({
        birthday: birth_date_str,
        isChange: true
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