
const { fetchPostTree, uploadToken } = require('../../../action/fetch');

const broadcast = require('../../../lib/broadcast')
const qiniuUploader = require("../../../utils/qiniuUploader");
Page({
  data: {
    avatarUrlLocal: '',
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const that = this

    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        if (res && res.data) {
          that.setData({
            userInfo: res.data
          })
        }
      }
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
  onCancel() {
    wx.navigateBack()
  },
  // onAvatarChange() {
  //   const _this = this;
  //   wx.chooseImage({
  //     count: 1, // 最多可以选择的图片张数，默认9
  //     sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
  //     sourceType: ['album'], // album 从相册选图，camera 使用相机，默认二者都有
  //     success: function (res) {
  //       // success
  //       console.log(res)
  //       const avatar_url = res.tempFilePaths[0];
  //       _this.setData({
  //         avatarUrlLocal: avatar_url
  //       })
  //     },
  //     fail: function () {
  //       // fail
  //     },
  //     complete: function () {
  //       // complete
  //     }
  //   })
  // },
  onAvatarChange() {
    const that = this;
    const { userInfo, avatarUrlLocal } = this.data,
      token = userInfo.data.token;
    console.log(token)
    wx.chooseImage({
      count: 1,
      success: function (res) {
        // success
        const filePath = res.tempFilePaths[0],
          imgtype = filePath.slice(-3);
        uploadToken(token, imgtype,2).then(resdata => {  // 获取七牛token
          const upToken = resdata.data.uploadToken,
            upKey = resdata.data.uploadKey;
          // 上传七牛
          that.setData({
            loading: false
          })
          qiniuUploader.upload(filePath, (res) => {
            const imgURL = res.data.urlFrameCapture,
              Id = res.data.id;
            that.setData({
              loading: false,
              resouceId: Id
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
  formSubmit(e) {
    const that = this
    console.log("addTree.js, formSubmit, e.detail.value:", e.detail.value)

    const nickname = e.detail.value.nickname
    // const is_open = e.detail.value.isOpen
    console.log(e.detail.value)
    if (!nickname) {
      wx.showModal({
        title: '提示',
        content: '请输入名称！',
        showCancel: false,
        success: function (res) {
        }
      })
      return
    }

    const {userInfo, avatarUrlLocal} = this.data

    const accessToken = userInfo.data.token;
    console.log(accessToken,userInfo)
    // const userId = tree.treeId;
    const tree_info = {
      "treeName": nickname

    };

    that.setData({
      loading: true
    })
    const data = {
      // "treeId": tree_id,
      "treeName": nickname,
      "token": accessToken,
      "resourceId": that.data.resouceId
    }
    // if (avatarUrlLocal) {
    //   fetchPostTree(accessToken, data)
    //     .then(res_data => {
    //       const avatarUrl = res_data.url;
    //       tree_info.imageUrl = avatarUrl;
    //       that.addTree(accessToken, tree_info)
    //     })
    //     .catch(error => {
    //       that.setData({
    //         loading: false
    //       })
    //       wx.showModal({
    //         title: '封面上传失败！',
    //         content: `错误信息：${error}`,
    //         showCancel: false,
    //         success: function (res) {

    //         }
    //       })
    //     })
    // } else {
    that.addTree(accessToken, data)
    // }
  },
  addTree(access_token, tree_info) {
    const that = this

    if (!access_token || !tree_info) {
      return
    }

    fetchPostTree(access_token, tree_info)
      .then(res_data => {
        const return_tree_info = res_data
        that.setData({
          loading: false
        })

        if (return_tree_info && return_tree_info.treeId) {
          wx.showToast({
            title: '创建家谱成功',
            icon: 'success'
          })

          broadcast.fire('tree_add_success')

          wx.redirectTo({
            url: `/pages/memory/tree/tree?treeId=${return_tree_info.treeId}`
          })
        }
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '创建家谱失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  }
})