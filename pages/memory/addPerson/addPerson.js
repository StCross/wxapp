const { fetchUploadFile, fetchPostPerson, fetchPutTree } = require('../../../action/fetch');

const broadcast = require('../../../lib/broadcast')

const event = require('../../../lib/event')

Page({
  data: {
    avatarUrlLocal: '',
    birthYear: '1990',
    isRelatedPerson: false,
    genderShowName: ['男', '女'],
    gender: ['male', 'female'],
    gender_index: 0
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const _this = this;

    console.log("addPerson.js, onLoad, options:", options);
    const tree_id = options.treeId
    const sex = options.sex;
    const originPersonId = options.originPersonId;
    const relation = options.relation;
    const relation_show_name = options.relationShowName

    if (originPersonId && sex) {
      _this.setData({
        avatarUrlLocal: '',
        birthYear: '1990',
        isRelatedPerson: true,
        treeId: tree_id,
        originPersonId: originPersonId,
        relation: relation,
        sex: sex
      })
    } else {
      _this.setData({
        avatarUrlLocal: '',
        birthYear: '1990',
        isRelatedPerson: false,
        treeId: tree_id,
      })
    }

    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        // success
        _this.setData({
          userInfo: res.data
        })
      }
    })

    if (originPersonId) {
      wx.getStorage({
        key: 'persons',
        success: function (res) {
          const persons = res.data
          if (persons && persons[originPersonId]) {
            const origin_person = persons[originPersonId]
            const origin_person_show_name =
              origin_person.nickname || origin_person.surname + origin_person.name || origin_person.relation
            _this.setData({
              originPersonShowName: origin_person_show_name,
              relationShowName: relation_show_name
            })
          }
        }
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
  },
  onCancel() {
    wx.navigateBack()
  },
  bindCountryChange(e) {
    console.log(e.detail.value);
    this.setData({
      year: e.detail.value,
      date: e.detail.value + "-01-01",
      is_chosedYear: true
    })
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value,
      show_date: e.detail.value.slice(5),
      is_choseDate: true
    })
  },
  onAvatarChange() {
    const _this = this;
    wx.chooseImage({
      count: 1, // 最多可以选择的图片张数，默认9
      sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
      sourceType: ['album'], // album 从相册选图，camera 使用相机，默认二者都有
      success: function (res) {
        // success
        console.log(res)
        const avatar_url = res.tempFilePaths[0];
        _this.setData({
          avatarUrlLocal: avatar_url
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
  onBirthYearChange(e) {
    const birth_year = e.detail.value

    if (birth_year) {
      this.setData({
        birthYear: birth_year
      })
    }
  },
  onGenderChange(e) {
    const gender_index = e.detail.value

    if (gender_index) {
      this.setData({
        gender_index: gender_index
      })
    }
  },
  formSubmit(e) {
    const that = this
    const nickname = e.detail.value.nickname

    if (!nickname) {
      wx.showModal({
        title: '提示',
        content: '请输入名字！',
        showCancel: false,
        success: function (res) {
        }
      })
      return
    }

    const {isRelatedPerson, birthYear, avatarUrlLocal, treeId, gender, gender_index, userInfo} = this.data
    const {originPersonId, relation, sex} = this.data

    const accessToken = userInfo.accessToken;
    const userId = userInfo.id;

    const person_data = {
      "nickname": nickname,
      "sex": gender[gender_index],
      "birthDate": {
        "type": "solar",
        "year": birthYear.toString(),
        "month": "",
        "day": "",
      },
      "treeId": treeId
    };

    if (isRelatedPerson) {
      person_data.sex = sex
      person_data.originPersonId = originPersonId
      person_data.relation = relation
    }

    that.setData({
      loading: true
    })

    const is_origin_person = !isRelatedPerson

    if (avatarUrlLocal) {
      fetchUploadFile(accessToken, avatarUrlLocal, userId)
        .then(res_data => {
          const avatarUrl = res_data.url;
          person_data.avatarUrl = avatarUrl;
          that.addPerson(accessToken, person_data, is_origin_person)
        })
        .catch(error => {
          that.setData({
            loading: false
          })
          wx.showModal({
            title: '头像上传失败！',
            content: `错误信息：${error}`,
            showCancel: false,
            success: function (res) {

            }
          })
        })
    } else {
      that.addPerson(accessToken, person_data, is_origin_person)
    }
  },
  addPerson(access_token, person_info, is_origin_person = false) {
    const that = this

    if (!access_token || !person_info) {
      return
    }

    const {treeId} = that.data

    fetchPostPerson(access_token, person_info)
      .then(res_data => {
        const return_person_info = res_data

        // if (is_origin_person && return_person_info.id) {
        // that.changeTreeCenterPerson(access_token, treeId, return_person_info.id)
        // } else {
        that.setData({
          loading: false
        })

        wx.showToast({
          title: '人物添加成功',
          icon: 'success'
        })

        //broadcast.fire('person_add_success', {
        //  treeId: treeId,
        //  personId: return_person_info.id
        //})

        event.emit('person_add_success', {
          treeId: treeId,
          personId: return_person_info.id
        })

        wx.navigateBack()
        // }
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '人物添加失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  },
  changeTreeCenterPerson(access_token, tree_id, center_person_id) {
    const tree_info = {
      corePersonId: center_person_id
    }

    fetchPutTree(access_token, tree_id, tree_info)
      .then(res_data => {
        const return_person_info = res_data

        // TODO: if is_origin_person, 修改tree的corePersonId

        that.setData({
          loading: false
        })

        wx.showToast({
          title: '人物添加成功',
          icon: 'success'
        })

        broadcast.fire('person_add_success', center_person_id)

        wx.navigateBack()
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '人物添加失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  }
})