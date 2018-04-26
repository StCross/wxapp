
const { addMemoir, uploadToken } = require('../../../action/fetch');
const broadcast = require('../../../lib/broadcast')
const qiniuUploader = require("../../../utils/qiniuUploader");

Page({
    data: {
        date: "出生年月",
        color: "#666",
        defaultBg: "https://ohc5vthqm.qnssl.com/syshu/2017-12-04/defaultbg.jpg"
    },
    onLoad() {
        const _this = this;
        let now_date = new Date();
        const now_month = now_date.getMonth() + 1
        now_date = now_date.getFullYear() + "-" + now_month + "-" + now_date.getDate();
        _this.setData({
            now_date: now_date
        })
        wx.getStorage({
            key: 'userInfo',
            success: function (res) {
                if (res && res.data) {
                    _this.setData({
                        userInfo: res.data
                    })
                }
            }
        })
    },
    bindDateChange: function (e) {
        this.setData({
            date: e.detail.value
        })
    },
    onAvatarChange() {
        const that = this;
        const { userInfo, avatarUrlLocal } = this.data,
          token = userInfo.data.token,
          filetype = 2;
        wx.chooseImage({
            count: 1, 
            success: function (res) {
              // success
              const filePath = res.tempFilePaths[0],
                imgtype = filePath.slice(-3);
              uploadToken(token, imgtype, filetype).then(resdata => {  // 获取七牛token
                const upToken = resdata.data.uploadToken,
                  upKey = resdata.data.uploadKey;
                // 上传七牛
                that.setData({
                  loading: true
                })
                qiniuUploader.upload(filePath, (res) => {
                  const imgURL = res.data.urlToken,
                    Id = res.data.id;
                  that.setData({
                    loading: false,
                    resouceId: Id,
                    imgURL: imgURL
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
              // that.setData({
              //   avatarUrlLocal: filePath
              // })
            },
            fail: function () {
                // fail
            },
            complete: function () {
                // complete
            }
        })
    },
    // onCancel(){
    //     wx.navigateBack({
    //       delta: 1, // 回退前 delta(默认为1) 页面
    //       success: function(res){
    //         // success
    //       },
    //       fail: function() {
    //         // fail
    //       },
    //       complete: function() {
    //         // complete
    //       }
    //     })
    // },
    formSubmit(e) {
        const that = this
        console.log("addTree.js, formSubmit, e.detail.value:", e.detail.value)
        const surname = e.detail.value.surname,
            name = e.detail.value.name;
        const date = that.data.date
        const date_array = date.split("-");
        const birthDate = {
            "type": "solar",
            "year": date_array[0],
            "month": date_array[1],
            "day": date_array[2]
        }
        if (!surname) {
            wx.showModal({
                title: '提示',
                content: '请输入姓氏！',
                showCancel: false,
                success: function (res) {
                }
            })
            return
        } else if (date == '出生年月') {
            wx.showModal({
                title: '提示',
                content: '请选择出生日期！',
                showCancel: false,
                success: function (res) {
                }
            })
            return
        } else if (!name) {
          wx.showModal({
            title: '提示',
            content: '请输入名称！',
            showCancel: false,
            success: function (res) {
            }
          })
          return
        }
        const { userInfo, resouceId } = this.data;
        const accessToken = userInfo.data.token,
          eventDate = birthDate.year;
        // const PersonMemory = {                  //上传日期格式待修改
        //     "name": date,
        //     "birthDate": birthDate
        // };
        that.setData({
            loading: true
        })
        if (surname != "" && name != "" && date !="出生年月") {
          addMemoir(surname, name, date, eventDate, accessToken, resouceId).then(resdata => {
            console.log(resdata)
            that.setData({
              loading: false
            })
            if (resdata.data) {
              wx.showToast({
                title: '创建回忆录成功',
                icon: 'success'
              })
            }
            broadcast.fire("memory_add_success")
            wx.redirectTo({
              url: `../memoryLine/memoryLine?personId=${resdata.data.personId}`,
              success: function (res) {
                // success
              }
            })
          }).catch(error => {
            that.setData({
              loading: false
            })
            wx.showModal({
              title: '创建回忆录失败！',
              content: `错误`,
              showCancel: false,
              success: function (res) {
              }
            })
          })
        }

    }
})