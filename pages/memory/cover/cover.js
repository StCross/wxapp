// pages/cover/cover.js

import keyBy from '../../../lib/lodash.keyby/index'
const broadcast = require('../../../lib/broadcast')
const event = require('../../../lib/event')

import { API_ROOT_URL, RED_WARNING_COLOR } from '../../../config/config'

import { fetchGetTrees, fetchDeleteTree, fetchDeleteSharedTree } from '../../../action/fetch'

const app = getApp()

Page({
  data: {},
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const that = this

    that.setData({
      loading: true
    })
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        const userInfo = res.data
        that.refreshPageAfterReceiveUserInfo(userInfo)
      },
    })
    // app.getUserInfo().then(user_info => {
    //   // console.log("cover.js, onLoad, app.getUserInfo, success, userInfo:", user_info)

    //   that.refreshPageAfterReceiveUserInfo(user_info)
    // }).catch(error => {
    //   that.setData({
    //     loading: false
    //   })
    // })

    broadcast.on("token_refresh_success", (user_info) => {
      that.refreshPageAfterReceiveUserInfo(user_info)
    })

    event.on('person_add_success', this, () => {
      that.onRefreshPage()
    })

    broadcast.on("person_delete_success", () => {
      that.onRefreshPage()
      // const user_info = this.data.userInfo
      // if (user_info) {
      //   that.refreshPageAfterReceiveUserInfo(user_info)
      // }
    })

    broadcast.on("tree_add_success", () => {
      that.onRefreshPage()
    })

    broadcast.on("tree_update_success", () => {
      console.log("更新了")
      that.onRefreshPage()
    })

    broadcast.on("tree_delete_success", () => {
      that.onRefreshPage()
    })
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
    // const that = this

    // wx.getStorage({
    //   key: 'userInfo',
    //   success: function (res) {
    //     if (res.data) {
    //       //console.log(res.data)
    //       const user_info = res.data

    //       that.refreshPageAfterReceiveUserInfo(user_info)
    //     }
    //   }
    // })
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  },
  refreshPageAfterReceiveUserInfo(user_info) {
    const that = this
    if (!user_info) {
      that.setData({
        loading: false
      })
      return
    }

    this.setData({
      userInfo: user_info
    })
    console.log(user_info)
    if (user_info && user_info.data.token) {
      console.log("fetchTrees")
      
      this.fetchTrees(user_info.data.token)
    } else {
      that.setData({
        loading: false
      })
    }
  },
  onRefreshPage() {
    const { userInfo } = this.data
    // console.log("cover xxxx onRefreshPage")
    if (userInfo && userInfo.data.token) {
      this.fetchTrees(userInfo.data.token)
    }
  },
  onPullDownRefresh() {
    this.onRefreshPage()
    wx.stopPullDownRefresh()
  },
  // onHeaderClick(e) {
  //   wx.previewImage({
  //     current: '',
  //     urls: [
  //       'https://ohc5vthqm.qnssl.com/tree/2017-1-23/1.jpg',
  //       'https://ohc5vthqm.qnssl.com/tree/2017-1-23/3.png'
  //     ]
  //   })
  // },
  onQAClick(e) {
    wx.navigateTo({
      url: '/pages/memory/qaList/qaList'
    })
  },
  onTreeClick(e) {
    const tree_id = e.currentTarget.dataset.treeId
    if (!tree_id) {
      return
    }

    if (this.data.is_tree_long_tap || this.data.is_shared_tree_long_tap) {
      return
    }

    wx.navigateTo({
      url: `/pages/memory/tree/tree?treeId=${tree_id}`
    })
  },
  onAddTreeClick() {
    wx.navigateTo({
      url: '/pages/memory/addTree/addTree'
    })
  },
  onEditTreeClick(e) {
    const tree_id = e.currentTarget.dataset.treeId

    if (!tree_id) {
      return
    }

    wx.navigateTo({
      url: `/pages/memory/updateTree/updateTree?treeId=${tree_id}`
    })
  },
  onTreeLongTap(e) {
    const that = this
    const tree_id = e.currentTarget.dataset.treeId
    const { userInfo } = this.data

    if (!tree_id) {
      return
    }

    that.setData({
      is_tree_long_tap: true
    })

    const menu_list = ['编辑家谱']

    if (tree_id !== userInfo.id) {
      menu_list.push('删除家谱')
    }

    wx.showActionSheet({
      itemList: menu_list,
      success: function (res) {
        switch (res.tapIndex) {
          case 0:
            wx.navigateTo({
              url: `/pages/memory/updateTree/updateTree?treeId=${tree_id}`
            })

            break;
          case 1:
            that.onDeleteTreeClick(tree_id)

            break;
          default:
            break;
        }

        that.setData({
          is_tree_long_tap: false
        })
      },
      fail: function (res) {
        that.setData({
          is_tree_long_tap: false
        })
      }
    })
  },
  onSharedTreeLongTap(e) {
    const that = this
    const tree_id = e.currentTarget.dataset.treeId

    if (!tree_id) {
      return
    }

    that.setData({
      is_shared_tree_long_tap: true
    })

    wx.showActionSheet({
      itemList: ['不再查看此家谱'],
      success: function (res) {
        switch (res.tapIndex) {
          case 0:
            that.onDeleteSharedTreeClick(tree_id)

            break;
          default:
            break;
        }

        that.setData({
          is_shared_tree_long_tap: false
        })
      },
      fail: function (res) {

      }
    })
  },
  onDeleteTreeClick(tree_id) {
    const that = this
    const { userInfo } = this.data
    const access_token = userInfo.data.token

    wx.getStorage({
      key: 'trees',
      success: function (res) {
        if (res && res.data) {
          const trees = res.data
          if (trees && trees[tree_id]) {
            const tree_info = trees[tree_id]
            console.log(tree_info)
            const tree_show_name = tree_info.treeName

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
          }
        }

      }
    })
  },
  onDeleteSharedTreeClick(tree_id) {
    const that = this
    const { userInfo } = this.data
    const access_token = userInfo.data.token

    wx.getStorage({
      key: 'trees',
      success: function (res) {
        if (res && res.data) {
          const trees = res.data
          if (trees && trees[tree_id]) {
            const tree_info = trees[tree_id]

            const tree_show_name = tree_info.treeName

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
        that.onRefreshPage()
        wx.showToast({
          title: '删除家谱成功',
          icon: 'success'
        })

      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '家谱删除失败！',
          content: `${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
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
          content: `${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  },
  fetchTrees(access_token) {
    const that = this

    fetchGetTrees(access_token)
      .then(response_data => {

        const created_tree_list = response_data
        // const shared_tree_list = response_data.shared
        let tree_list = created_tree_list || []
        // tree_list = tree_list.concat(shared_tree_list)

        const trees = keyBy(tree_list, 'treeId')

        that.setData({
          loading: false
        })

        wx.setStorage({
          key: "trees",
          data: trees
        })

        console.log("tree_list : ", tree_list)
        that.setData({
          // createdTreeList: created_tree_list,
          // sharedTreeList: shared_tree_list,
          tree_list: tree_list
        })

        wx.stopPullDownRefresh()
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '获取家谱列表失败！',
          content: `${error}`,
          showCancel: false,
          success: function (res) {
          }
        })
      })
  }
})