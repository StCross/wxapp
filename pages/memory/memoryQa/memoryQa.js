const { getModelTagList, addModel } = require('../../../action/fetch');
const broadcast = require('../../../lib/broadcast');
const _ = require('../../../lib/lodash/lodash')
Page({
  data: {
    chosed: true,
    index: 0,
    selected: [],
    selectAll: []
  },
  onLoad: function (options) {
    // 页面初始化
    const personId = options.personId
    const that = this
    that.setData({
      personId: personId
    })
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        const userInfo = res.data,
          token = userInfo.data.token;
        that.setData({
          loading: true
        })
        if (token) {
          getModelTagList(personId, token).then(data => {
            let tag = ['已选']
            let list = [[]]
            let all = []
            let selectAll = [true]
            for (let i = 0, _data = data.tagList; i < _data.length; i++) {
              let v = _data[i]
              tag.push(v['tag'])
              list.push(v['modelList'])
              all.push(...v['modelList'])
              selectAll.push(false)
            }
            let selected = []
            let keyByAll = all.reduce((p, v, i) => {
              p[v.eventModelId] = v
              return p
            }, {})
            data.ids.map(item => {
              let v = keyByAll[item]
              if(!v)return
              v.checked = true
              selected.push(v)
            })
            let countNum = count(selected)
            that.setData({
              loading: false,
              tag: tag,
              list: list,
              all: all,
              curList: selected,
              selected: selected,
              selectAll: selectAll,
              keyByAll: keyByAll,
              count: countNum
            })
            // that.curListHandler(that.data.index)
          })
        }
        that.setData({
          userInfo: res.data
        })
      },
    })
  },
  checkboxChange(e) {
    // console.log(e)
    if (this.data.index !== 0) {
      const removeItems = this.data.curList.filter(v => v.checked === true).filter(i => e.detail.value.indexOf(i.eventModelId) === -1)
      const curList = this.data.curList
      let selected = this.data.selected
      let isSelectAll = true, selectAll = this.data.selectAll

      if (removeItems.length === 0) {
        let newItems;
        e.detail.value.map(item => {
          curList.map(_item => {
            if (_item.eventModelId === item) {
              newItems = _item
              curList[curList.indexOf(_item)].checked = true
            }
          })
        })
        newItems.checked = true
        selected = selected.concat(newItems)

        curList.map(v => {
          if (!v.checked) {
            isSelectAll = false
          }
        })
        selectAll[this.data.index] = isSelectAll ? true : false
        let countNum = count(selected)
        selected = _.uniqBy(selected, 'eventModelId')
        selected.map(v => {
          if (v.eventModelId == newItems.eventModelId) {
            v.checked = true
          }
        })
        this.setData({
          curList: curList,
          selected: selected,
          selectAll: selectAll,
          count: countNum
        })
      } else {
        let selectedList = this.data.selected
        selectedList.map(item => {
          if (item.eventModelId === removeItems[0].eventModelId) {
            selectedList.splice(selectedList.indexOf(item), 1)
          }
        })
        curList.map(_item => {
          if (removeItems[0].eventModelId === _item.eventModelId) {
            curList[curList.indexOf(_item)].checked = false
          }
        })
        curList.map(v => {
          if (!v.checked) {
            isSelectAll = false
          }
        })
        selectAll[this.data.index] = isSelectAll ? true : false
        let countNum = count(selectedList)
        selectedList = _.uniqBy(selectedList, 'eventModelId')
        this.setData({
          selected: selectedList,
          curList: curList,
          selectAll: selectAll,
          count: countNum
        })
      }
    } else {
      let selectedList = this.data.selected
      let newSelectChecked = e.detail.value
      let selectAll = this.data.selectAll
      let isSelectAll = true
      selectedList.map(v => {
        let isCheck = false
        newSelectChecked.map(vv => {
          if (vv == v.eventModelId) {
            isCheck = true
          }
        })
        v.checked = isCheck
        if (!v.checked) {
          isSelectAll = false
        }
      })
      let countNum = count(selectedList)
      selectedList = _.uniqBy(selectedList, 'eventModelId')
      selectAll[this.data.index] = isSelectAll ? true : false
      this.setData({
        selected: selectedList,
        selectAll: selectAll,
        count: countNum
      })
    }

  },
  titleClick(e) {
    let index = e.currentTarget.dataset.tindex
    this.setData({
      index: index
    })
    this.curListHandler(index)
    // console.log(this.data)
  },
  curListHandler(i) {
    let curList, isSelectAll = true, selectAll = this.data.selectAll

    if (i === 0) {
      curList = this.data.selected
      curList.map(v => {
        if (!v.checked) {
          isSelectAll = false
        }
      })
    } else {
      curList = this.data.list[this.data.index]
      curList.map(v => {
        // console.log(v.eventModelId, this.data.selected.find(vv => vv.eventModelId === v.eventModelId) )
        v.checked = this.data.selected.find(vv => vv.eventModelId === v.eventModelId && vv.checked) ? true : false
        // v.isUpload = false
        if (!v.checked) {
          isSelectAll = false
        }
      })
    }
    selectAll[i] = isSelectAll ? true : false
    this.setData({
      curList: curList,
      selectAll: selectAll
    })
  },
  clearSelected() {
    let selectAll = this.data.selectAll
    selectAll[this.data.index] = !this.data.selectAll[this.data.index]
    if (this.data.index === 0) {
      let selectedList = this.data.selected
      if (selectAll[this.data.index]) {
        selectedList.map(v => {
          v.checked = true
        })
      } else {
        selectedList.map(v => {
          v.checked = false
        })
        selectedList=[]
      }
      let countNum = count(selectedList)
      selectedList = _.uniqBy(selectedList, 'eventModelId')
      this.setData({
        selected: selectedList,
        count: countNum
      })
    } else {

      let selectedList = this.data.selected
      let curList = this.data.curList
      if (selectAll[this.data.index]) {
        console.log("全选")
        curList.map(v => {
          v.checked = true
        })
        selectedList = selectedList.concat(curList)
        // selectedList = selectedList.unique()
        selectedList = _.uniqBy(selectedList, 'eventModelId')
        console.log(selectedList)
        selectedList.map(v => {
          v.checked = true
        })
        // console.log(curList)
        // console.log(selectedList)

      } else {
        console.log("取消全选")
        selectedList = selectedList.filter(v => !(curList.find(vv => vv.eventModelId === v.eventModelId)))
        curList.map(v => {
          v.checked = false
        })
      }
      let countNum = count(selectedList)
      this.setData({
        selected: selectedList,
        curList: curList,
        count: countNum
      })
    }
    console.log(this.data)
  },
  save() {
    this.setData({
      saveloading: true
    })
    let ids = []
    this.data.selected.map(v => {
      if (v.checked) {
        ids.push(v.eventModelId)
      }
    })
    addModel({
      personId: this.data.personId,
      ids: ids,
      token: this.data.userInfo.data.token
    }).then(data => {
      // console.log(data)
      broadcast.fire("addmemoryQa_success", data)
      wx.navigateBack({
        delta: 1,
        success: function (res) {
        }
      })
      this.setData({
        saveloading: false
      })
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
  }
})
function count(arr) {
  let count = 0
  arr.map(v => {
    if (v.checked) {
      count++
    }
  })
  return count
}

Array.prototype.unique = function () {
  this.sort(); //先排序
  var res = [this[0]];
  for (var i = 1; i < this.length; i++) {
    if (this[i] !== res[res.length - 1]) {
      res.push(this[i]);
    }
  }
  return res;
}
