
const { WWW_ROOT_URL,SIT_ROOT_URL,} = require('../config/config')

const API_URL = WWW_ROOT_URL //SIT_ROOT_URL

function fetchGetUserMe(access_token) {
  return wx.pro.fetchData({
    url: `${API_URL}/users/me`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchUserLogin(code, encryptedData,iv) {

  return wx.pro.request({
    url: `${API_URL}/auth/login`,
    data: {
      codeFromWeixin: code,
      clientType: 7,
      encryptedData: encryptedData,
      iv: iv
    },
    method: 'POST',
    header: {
      'content-type': 'application/json'
    }
  })
}

function _fetchUserLogin(code) {

  return wx.pro.request({
    url: `${API_URL}/auth/login`,
    data: {
      codeFromWeixin: code,
      clientType: 7
    },
    method: 'POST',
    header: {
      'content-type': 'application/json'
    }
  })
}

function findUserInfo(access_token) {   // 查询用户信息
  return wx.pro.fetchData({
    url: `${API_URL}/user/findUser`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'content-type': 'application/json'
    }
  })
}

// function fetchGetEventsAll(access_token, page = 0, amount = 20) {
//   return wx.pro.fetchData({
//     url: `${API_ROOT_URL}/events/all?page=${page}&amount=${amount}&order=-date`,
//     method: 'GET',
//     data: {},
//     header: {
//       'Authorization': `Bearer ${access_token}`,
//       'Accept': 'application/json'
//     }
//   })
// }
function fetchGetEventsAll(access_token) {   // 获取回想录列表
  return wx.pro
    .request({
      url: `${API_URL}/tree/getTreeList`,
      data: {
        "haveMemoir": 1,
        "pageSize": 0,
        "token": access_token
      },
      method: 'POST',
      header: {
        'Authorization': `Bearer ${access_token}`,
        'content-type': 'application/json'
      }
    })
}
function fetchGetEvents(access_token, user_id, person_id, page = 0, amount = 50) {
  return wx.pro.fetchData({
    url: `${API_URL}/events`,
    method: 'GET',
    data: {
      "userId": user_id,
      "personId": person_id,
      "page": page,
      "amount": amount
    },
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchPostEvent(access_token, event) {
  return wx.pro.fetchData({
    url: `${API_URL}/events`,
    data: event,
    method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
    header: {
      'Authorization': `Bearer ${access_token}`,
    }, // 设置请求的 header
  })
}

function fetchGetPersons(access_token) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons`,
    method: 'GET',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchGetPersonRelations(access_token) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons/relations`,
    method: 'GET',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchGetPerson(access_token, person_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons/${person_id}`,
    method: 'GET',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchPostPerson(access_token, person_info) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons`,
    method: 'POST',
    data: person_info,
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchPutPerson(access_token, person_id, person_info) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons/${person_id}`,
    data: person_info,
    method: 'PUT',
    header: {
      'Authorization': `Bearer ${access_token}`,
    }
  })
}

function fetchDeletePerson(access_token, person_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/persons/${person_id}`,
    data: {},
    method: 'DELETE',
    header: {
      'Authorization': `Bearer ${access_token}`,
    }
  })
}

function fetchUpdataTree(access_token, data) {
  return wx.pro.request({
    url: `${API_URL}/tree/updateTree`,
    data: data,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}
function uploadToken(access_token, imgType) {    // 获取七牛token
  return wx.pro.request({
    url: `${API_URL}/resource/getQNToken`,
    data: {
      fileType: 2,
      suffixType: imgType,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchGetTrees(access_token) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/getTreeList`,
    method: 'POST',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchPostTree(access_token, data) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/addTree`,
    method: 'POST',
    data: data,
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchPutTree(access_token, tree_id, tree_info) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/updateTree`,
    method: 'POST',
    data: {
      "userInfo": tree_info,
      "treeId": tree_id
    },
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchDeleteTree(access_token, tree_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/deleteTree`,
    method: 'POST',
    data: {
      "treeId": tree_id
    },
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchDeleteSharedTree(access_token, tree_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/shared/${tree_id}`,
    method: 'DELETE',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchGetTreeInfoAndTreePersons(access_token, tree_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/${tree_id}`,
    method: 'GET',
    data: {},
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchUserBindTreePerson(access_token, tree_id, person_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/claim`,
    method: 'POST',
    data: {
      treeId: tree_id,
      personId: person_id
    },
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function fetchUserUnbindTreePerson(access_token, tree_id, person_id) {
  return wx.pro.fetchData({
    url: `${API_URL}/tree/unclaim`,
    method: 'POST',
    data: {
      treeId: tree_id,
      personId: person_id
    },
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}




function updateUserUnion(access_token, userId, userAvatar, userNick) {  // 更新用户信息
  return wx.pro.request({
    url: `${API_URL}/user/updateUserUnion`,
    data: {
      "userId": userId,
      "avatar": userAvatar,
      "nickname": userNick
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'content-type': 'application/json'
    }
  })
}

function findMemoirList(access_token) {   // 获取回想录列表
  return wx.pro.request({
    url: `${API_URL}/memoir/findMemoirList`,
    data: {
      "haveMemoir": 1,
      "pageSize": 0,
      "token": access_token,
      "findMemoirList": true
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'content-type': 'application/json'
    }
  })
}

function addMemoir(surName, Name, birth, Year, access_token, resouceId) {    // 添加回想录
  return wx.pro.request({
    url: `${API_URL}/memoir/addPersonInfo`,
    data: {
      "surname": surName,
      "name": Name,
      "birthday": birth,
      "birthYear": Year,
      "haveMemoir": 1,
      "birthDateType": 2,
      "gender": 0,
      "token": access_token,
      "resourceId": resouceId
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'content-type': 'application/json'
    }
  })
}

function uploadToken(access_token, suffType, filetype) {    // 获取七牛token
  return wx.pro.request({
    url: `${API_URL}/resource/getQNToken`,
    data: {
      fileType: filetype,
      suffixType: suffType,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getEventListMemoir(perId, access_token) {    // 获取人物事件列表
  return wx.pro.fetchData({
    url: `${API_URL}/event/getEventListOfMemoir`,
    data: {
      personId: perId,
      token: access_token,
      pageSize: 0,
      haveHistory: 1
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getPersonInfo(pId, access_token) {   // 人物详情信息
  return wx.pro.fetchData({
    url: `${API_URL}/memoir/getPersonInfo`,
    data: {
      personId: pId,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function updatePersonInfo(personId, access_token, surname, name, birth, TxId, coverId) {    // 更新人物信息
  return wx.pro.request({
    url: `${API_URL}/memoir/updatePersonInfo`,
    data: {
      personId: personId,
      token: access_token,
      surname: surname,
      name: name,
      birthday: birth,
      // birthYear: Year,
      resourceIdTx: TxId,
      resourceIdFm: coverId,
      haveMemoir: 1,
      birthDateType: 4,
      gender: 0
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function deletePersonInfo(personId, access_token) {   // 删除人物
  return wx.pro.fetchData({
    url: `${API_URL}/memoir/deletePersonInfo`,
    data: {
      personId: personId,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function deleteMemoir(personId, access_token) {   // 删除回想录
  return wx.pro.fetchData({
    url: `${API_URL}/memoir/deleteMemoir`,
    data: {
      personId: personId,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getComments(access_token, eventId, pageSize, start) {
  return wx.pro.fetchData({
    url: `${API_URL}/comment/getComments`,
    data: {
      token: access_token,
      eventId: eventId,
      pageSize: 10,
      start: 0
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getEventInfo(eventId, access_token) {    // 事件详情
  return wx.pro.fetchData({
    url: `${API_URL}/event/getEventInfo`,
    data: {
      eventId: eventId,
      token: access_token,
      getPersonInfo: true
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function deleteEvent(eventId, perId, access_token) {   // 删除事件
  return wx.pro.fetchData({
    url: `${API_URL}/event/deleteEvent`,
    data: {
      eventId: eventId,
      personId: perId,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function addEvent(personId, access_token, eventTitle, eventContent, eventDate, resouceid) {   // 添加回忆(事件)
  return wx.pro.fetchData({
    url: `${API_URL}/event/addEvent`,
    data: {
      personId: personId,
      token: access_token,
      eventTitle: eventTitle,
      eventContent: eventContent,
      eventDate: eventDate,
      eventDateType: 4,
      resourceIds: resouceid
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function updateEvent(access_token, personId, eventId, eventTitle, specialType, eventContent, eventDate, eventDateType, resouceid) {   // 更新事件
  return wx.pro.fetchData({
    url: `${API_URL}/event/updateEvent`,
    data: {
      token: access_token,
      personId: personId,
      eventId: eventId,
      eventTitle: eventTitle,
      specialType: specialType,
      eventContent: eventContent,
      eventDate: eventDate,
      eventDateType: eventDateType,
      resourceIds: resouceid
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getModelTagList(personId, access_token) {   // 获取回忆问答tagList
  return wx.pro.fetchData({
    url: `${API_URL}/model/getModelListByTag`,
    data: {
      personId: personId,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function addModel(data) {   // 获取回忆问答tagList
  return wx.pro.fetchData({
    url: `${API_URL}/model/addModel`,
    data: {
      personId: data.personId,
      ids: data.ids,
      token: data.token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${data.token}`,
      'Accept': 'application/json'
    }
  })
}

function updateShareTime(memoirId, shareTitle, access_token) {   // 分享调用修改时间戳(轴分享)
  return wx.pro.fetchData({
    url: `${API_URL}/share/updateShareTime`,
    data: {
      memoirId: memoirId,
      shareTitle: shareTitle,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function otherShareTime(eventId, shareTitle, access_token) {   // 分享调用修改时间戳(轴分享)
  return wx.pro.fetchData({
    url: `${API_URL}/share/updateShareTime`,
    data: {
      eventId: eventId,
      shareTitle: shareTitle,
      token: access_token
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

function getComments(access_token, eventId, pageNo) {
  return wx.pro.fetchData({
    url: `${API_URL}/comment/getComments`,
    data: {
      token: access_token,
      eventId: eventId,
      pageNo: 0
    },
    method: 'POST',
    header: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  })
}

module.exports = {
  fetchGetUserMe,
  fetchUserLogin,
  findUserInfo,
  fetchGetEventsAll,
  fetchGetEvents,
  fetchPostEvent,
  fetchGetPersons,
  fetchGetPersonRelations,
  fetchGetPerson,
  uploadToken,
  fetchPostPerson,
  fetchPutPerson,
  fetchDeletePerson,
  fetchGetTrees,
  fetchPostTree,
  fetchPutTree,
  fetchDeleteTree,
  fetchDeleteSharedTree,
  fetchGetTreeInfoAndTreePersons,
  fetchUserBindTreePerson,
  fetchUserUnbindTreePerson,
  fetchUpdataTree,
  //
  updateUserUnion,
  findMemoirList,
  addMemoir,
  getEventListMemoir,
  getPersonInfo,
  updatePersonInfo,
  deletePersonInfo,
  deleteMemoir,
  getEventInfo,
  deleteEvent,
  addEvent,
  updateEvent,
  addModel,
  getModelTagList,
  updateShareTime,
  otherShareTime,
  getComments
}
