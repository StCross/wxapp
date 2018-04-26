const { fetchGetPerson, fetchUploadFile, fetchPutPerson } = require('../../../action/fetch');

const broadcast = require('../../../lib/broadcast')

import assign from '../../../lib/object-assign';

Page({
  data: {
    avatarUrlLocal: '',
    genderShowName: ['男', '女'],
    gender: ['male', 'female'],
    gender_index: 0,
    nowDate: new Date().toUTCString().slice(10),
    isEditable: false,
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    const _this = this;

    console.log("uploadPerson.js, onLoad, options:", options);
    const tree_id = options.treeId
    const person_id = options.personId

    if (!person_id) {
      return
    }

    wx.getStorage({
      key: 'trees',
      success: function (res) {
        const trees = res.data

        _this.setData({
          treeInfo: trees[tree_id]
        })
      }
    })

    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        // success
        const user_info = res.data
        _this.setData({
          userInfo: user_info
        })

        const user_id = user_info.id
        const access_token = user_info.accessToken

        if (person_id && access_token) {
          wx.getStorage({
            key: 'persons',
            success: function (res) {
              const persons = res.data
              if (persons && persons[person_id]) {
                const person = persons[person_id]

                const birth_date = person.birthDate
                const show_birthday = birth_date.year + "-" + birth_date.month + "-" + birth_date.day

                const tree_creator_id = (_this.data.treeInfo && _this.data.treeInfo.creator) ?
                  _this.data.treeInfo.creator.id : ''
                const person_creator_id = (person.creator && person.creator.id) ? person.creator.id : ''

                const is_editable = (user_id === person_creator_id || user_id === tree_creator_id)

                _this.setData({
                  person: person,
                  birthday: show_birthday,
                  gender_index: person.sex === 'male' ? 0 : 1,
                  isEditable: is_editable
                })
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
    const {birthDate} = this.data

    if (birth_year) {
      this.setData({
        birthDate: {
          year: birth_year,
          month: birthDate.month,
          day: birthDate.day
        }
      })
    }
  },
  onBirthDateChange(e) {
    const birth_date_str = e.detail.value

    if (birth_date_str) {
      this.setData({
        birthday: birth_date_str
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
    const {nickname, name, surname} = e.detail.value

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

    const {birthday, avatarUrlLocal, gender, gender_index, userInfo, person} = this.data

    const accessToken = userInfo.accessToken;
    const userId = userInfo.id;

    const birthday_split_list = birthday.split("-");

    const person_data = {
      personId: person.id,
      "nickname": nickname,
      name: name,
      surname: surname,
      "sex": gender[gender_index],
      "birthDate": {
        "type": "solar",
        "year": birthday_split_list[0],
        "month": birthday_split_list[1],
        "day": birthday_split_list[2]
      }
    };

    that.setData({
      loading: true
    })

    if (avatarUrlLocal) {
      fetchUploadFile(accessToken, avatarUrlLocal, userId)
        .then(res_data => {
          const avatarUrl = res_data.url;
          person_data.avatarUrl = avatarUrl;
          that.changePersonInfo(accessToken, person.id, person_data)
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
      that.changePersonInfo(accessToken, person.id, person_data)
    }
  },
  changePersonInfo(access_token, person_id, person_info) {
    const that = this

    if (!access_token || !person_id || !person_info) {
      return
    }

    fetchPutPerson(access_token, person_id, person_info)
      .then(res_data => {
        const return_person_info = res_data

        that.setData({
          loading: false
        })

        wx.showToast({
          title: '人物信息修改成功',
          icon: 'success'
        })

        broadcast.fire('person_update_success', person_id)

        wx.navigateBack()
      })
      .catch(error => {
        that.setData({
          loading: false
        })

        wx.showModal({
          title: '修改人物信息失败！',
          content: `错误信息：${error}`,
          showCancel: false,
          success: function (res) {

          }
        })
      })
  }
})