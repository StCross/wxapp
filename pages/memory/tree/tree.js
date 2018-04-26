
import keyBy from '../../../lib/lodash.keyby/index'
import assign from '../../../lib/object-assign';

const broadcast = require('../../../lib/broadcast')

const event = require('../../../lib/event')

import { API_ROOT_URL, tree_option, RED_WARNING_COLOR } from '../../../config/config'

import {
  fetchGetTreeInfoAndTreePersons, fetchDeletePerson, fetchUserBindTreePerson, fetchUserUnbindTreePerson,
  fetchGetPerson, fetchPutTree
} from '../../../action/fetch'


Page({
  data: {
    dragging: false,
    drag_left: 0,
    drag_top: 0,
    scale_degree: 1.0,
    showPersonList: [],
    personAmount: 0,
    activePersonId: ''

  },
  onLoad: function (options) {
    const that = this
    console.log("tree.js, onLoad, options:", options);
    // 页面初始化 options为页面跳转所带来的参数
    const tree_id = options.treeId

    if (!tree_id) {
      return
    }
    this.setData({
      treeId: tree_id
    })
    var userInfo = wx.getStorageSync('userInfo')
    var token = userInfo.data.token
    // var url = "https://sit.sysshu.com/family/mob/5fe5f708-8240-11e7-b306-00163e302c91?toke="+token
    var url = `https://www.sysshu.com/family/mob/${tree_id}?token=${token}`
    //var url = `https://sit.sysshu.com/static/vote/newspaper-20171111/index.html?code=1&test=1&debug=1`
    
    // var url = `http://127.0.0.1:8080/family/mob/${tree_id}?toke=${token}`
    console.log(token)
    this.setData({
      url:url
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

})
