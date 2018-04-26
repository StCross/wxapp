
const { fetchUpdataTree, uploadToken, fetchPutTree, fetchDeleteTree, fetchDeleteSharedTree } = require('../../../action/fetch');

const broadcast = require('../../../lib/broadcast')

import { RED_WARNING_COLOR } from '../../../config/config'

const qiniuUploader = require("../../../utils/qiniuUploader");

Page({
  data: {
    avatarUrlLocal: '',
    isEditable: false
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const that = this
    // console.log("updateTree.js, onLoad, options:", options)

    const tree_id = options.treeId
    if (!tree_id) {
      return
    }

    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        if (res && res.data) {
          const user_info = res.data
          that.setData({
            userInfo: user_info
          })

          const user_id = user_info.data.userId

          wx.getStorage({
            key: 'trees',
            success: function (res) {
              if (res && res.data) {
                const trees = res.data
                if (trees && trees[tree_id]) {
                  const tree_info = trees[tree_id]
                  const tree_creator_id = (tree_info && tree_info.createUser) ? tree_info.createUser : ''
                  const is_editable = (user_id === tree_creator_id)
                  const is_deletable = (user_id !== tree_id)

                  that.setData({
                    tree: tree_info,
                    isEditable: is_editable,
                    isDeletable: is_deletable
                  })
                }
              }
            }
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
        that.setData({
          loading: true
        });
        uploadToken(token, imgtype,2).then(resdata => {  // 获取七牛token
          const upToken = resdata.data.uploadToken,
            upKey = resdata.data.uploadKey;
          // 上传七牛
          // that.setData({
          //   loading: false
          // })
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
    console.log("updateTree.js, formSubmit, e.detail.value:", e.detail.value)

    const nickname = e.detail.value.nickname
    const is_open = e.detail.value.isOpen
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

    const { userInfo, avatarUrlLocal, tree } = this.data
    const accessToken = userInfo.data.token;
    const userId = userInfo.data.userId;
    const tree_id = tree.treeId
    const tree_info = {
      "name": nickname,
      "isOpen": is_open
    };

    that.setData({
      loading: true
    })
    const data = {
      "treeId": tree_id,
      "treeName": nickname,
      "token": accessToken,
      "resourceId": that.data.resouceId ? that.data.resouceId : that.data.tree.resourceInfo.id
    }
    // const data = {
    //   "treeId": "c129d2e4-d989-11e7-b306-00163e302c91",
    //   "treeName": "九1谪的家谱",
    //   "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxNTgzODEwOTg4OCIsImF1ZGllbmNlIjoid2ViIiwiY3JlYXRlZCI6MTUxMjM2OTc4NzM4NCwiZXhwIjoxNTEyOTc0NTg3fQ.xi0KGr2KtiM8aV_F8y5kxVHsurs0mZMynwJ8wZ-aWgAMGC-NqpQ4G4CndMcKBosAi2KhL3Y4_uvP1HT9_y4czw",
    //   "resourceId": "20d263aa-d994-11e7-b306-00163e302c91"
    // }
    that.updateTree(accessToken, data)
  },
  onDeleteTreeClick() {
    const that = this
    const { userInfo, tree } = this.data
    const access_token = userInfo.data.token
    const tree_id = tree.treeId
    if (!tree || !tree_id || !access_token) {
      return
    }

    const tree_show_name = tree.treeName
    wx.showModal({
      title: `确定要删除（${tree_show_name}）吗？`,
      content: '删除后所有关于该家谱上的人物都将被删除。',
      confirmText: '确定删除',
      confirmColor: RED_WARNING_COLOR,
      success: function (res) {
        if (res.confirm) {
          that.deleteTree(access_token, tree_id)
        }
      }
    })
  },
  onDeleteSharedTreeClick() {
    const that = this
    const { userInfo, tree } = this.data
    const access_token = userInfo.data.token
    const tree_id = tree.treeId

    wx.getStorage({
      key: 'trees',
      success: function (res) {
        if (res && res.data) {
          const trees = res.data
          if (trees && trees[tree_id]) {
            const tree_info = trees[tree_id]

            const tree_show_name = tree.treeName
            console.log(tree_show_name)
            wx.showModal({
              title: `确定要删除（${tree_show_name}）吗？`,
              content: `删除后您将无法查看（${tree_show_name}）。`,
              confirmText: '确定删除',
              confirmColor: RED_WARNING_COLOR,
              success: function (res) {
                if (res.confirm) {
                  that.deleteSharedTree(access_token, tree_id)
                }
              }
            })
          }
        }
      }
    })
  },
  updateTree(access_token, data) {
    const that = this

    if (!access_token || !data) {
      return
    }

    fetchUpdataTree(access_token, data)
      .then(res_data => {
        const return_tree_info = res_data
        that.setData({
          loading: false
        })
        console.log(return_tree_info)
        if (return_tree_info && return_tree_info.data.treeId) {
          wx.showToast({
            title: '修改家谱信息成功',
            icon: 'success'
          })
          broadcast.fire('tree_update_success')

          wx.navigateBack()
        }
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '修改家谱信息失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  },
  deleteTree(access_token, tree_id) {
    const that = this

    if (!access_token || !tree_id) {
      return
    }

    that.setData({
      loading: true
    })

    fetchDeleteTree(access_token, tree_id)
      .then(res_data => {
        that.setData({
          loading: false
        })

        wx.showToast({
          title: '删除家谱成功',
          icon: 'success'
        })

        broadcast.fire('tree_delete_success')

        wx.navigateBack({
          delta: 2
        })

      })
      .catch(error => {
        that.setData({
          loading: false
        })
        that.onRefreshPage()
        wx.showModal({
          title: '家谱删除失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
    // that.onRefreshPage()
  },
  deleteSharedTree(access_token, tree_id) {
    const that = this

    if (!access_token || !tree_id) {
      return
    }

    that.setData({
      loading: true
    })

    fetchDeleteSharedTree(access_token, tree_id)
      .then(res_data => {
        that.setData({
          loading: false
        })

        wx.showToast({
          title: '删除家谱成功',
          icon: 'success'
        })

        that.onRefreshPage()
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '家谱删除失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  }
})