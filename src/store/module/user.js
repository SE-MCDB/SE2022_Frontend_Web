import {
  login,
  register,
  getUserInfo,
  getMessage,
  getContentByMsgId,
  hasRead,
  removeReaded,
  restoreTrash,
  getUnreadCount
} from '@/api/user'
import { setToken, getToken, setRefreshToken, getRefreshToken } from '@/libs/util'

export default {
  state: {
    userName: '',
    userIsSponsor: false,
    userId: '',
    userEmail: '',
    userInstitution: '',
    userTotalFan: 0,
    userTotalLike: 0,
    userTotalPost: 0,
    userpic: '',
    token: getToken(),
    refresh_token: getRefreshToken(),
    access: '',
    hasGetInfo: false,
    unreadCount: 0,
    messageUnreadList: [],
    messageReadedList: [],
    messageTrashList: [],
    messageContentStore: {}
  },
  mutations: {
    setAvatar (state, userpic) {
      state.userpic = 'http://122.9.14.73:8000/api/' + userpic
    },
    setUserName (state, name) {
      state.userName = name
    },
    setUserProfile (state, params) {
      state.userName = params.nickname === '' ? params.username : params.nickname
      state.userId = params.id
      state.userEmail = params.email
      state.userInstitution = params.institution
      state.userTotalFan = params.total_fan
      state.userTotalLike = params.total_like
      state.userTotalPost = params.total_post
      state.userIsSponsor = params.is_sponsor
      state.userpic = 'http://122.9.14.73:8000/api/' + params.userpic
    },
    setAccess (state, access) {
      state.access = access
    },
    setToken (state, token) {
      state.token = token
      setToken(token)
    },
    setRefreshToken (state, token) {
      state.refresh_token = token
      setRefreshToken(token)
    },
    setHasGetInfo (state, status) {
      state.hasGetInfo = status
    },
    setMessageCount (state, count) {
      state.unreadCount = count
    },
    setMessageUnreadList (state, list) {
      state.messageUnreadList = list
    },
    setMessageReadedList (state, list) {
      state.messageReadedList = list
    },
    setMessageTrashList (state, list) {
      state.messageTrashList = list
    },
    updateMessageContentStore (state, { msg_id, content }) {
      state.messageContentStore[msg_id] = content
    },
    moveMsg (state, { from, to, msg_id }) {
      const index = state[from].findIndex(_ => _.msg_id === msg_id)
      const msgItem = state[from].splice(index, 1)[0]
      msgItem.loading = false
      state[to].unshift(msgItem)
    }
  },
  getters: {
    messageUnreadCount: state => state.messageUnreadList.length,
    messageReadedCount: state => state.messageReadedList.length,
    messageTrashCount: state => state.messageTrashList.length
  },
  actions: {
    // ??????
    handleRegister ({ commit }, { userName, password, email }) {
      userName = userName.trim()
      return new Promise((resolve, reject) => {
        register('post', {
          username: userName,
          password: password,
          email: email
        }).then(res => {
          resolve()
        }).catch(err => {
          reject(err)
        })
      })
    },
    // ??????
    handleLogin ({ commit }, { userName, password }) {
      userName = userName.trim()
      return new Promise((resolve, reject) => {
        login('post', {
          username: userName,
          password: password
        }).then(res => {
          const data = res.data
          commit('setToken', data.access_token)
          commit('setRefreshToken', data.refresh_token)
          getUserInfo().then(res => {
            commit('setUserProfile', res.data)
          }).catch(error => {
            this.$Modal.error(getErrModalOptions(error))
          })
          resolve()
        }).catch(err => {
          reject(err)
        })
      })
    },
    // ????????????
    handleLogOut ({ state, commit }) {
      return new Promise((resolve, reject) => {
        // logout(state.token).then(() => {
        //   commit('setToken', '')
        //   commit('setAccess', [])
        //   resolve()
        // }).catch(err => {
        //   reject(err)
        // })
        // ???????????????????????????????????????????????????????????????????????????????????????????????????logout????????????
        commit('setToken', '')
        commit('setRefreshToken', '')
        setToken('') // ?????? cookie ??????
        setRefreshToken('')
        // commit('setAccess', [])
        resolve()
      })
    },
    // ???????????????????????????????????????????????????????????????????????????????????????
    getUnreadMessageCount ({ state, commit }) {
      getUnreadCount().then(res => {
        console.log(res)
        commit('setMessageCount', res.data.num)
      })
    },
    // ????????????????????????????????????????????????????????????????????????
    getMessageList ({ state, commit }) {
      return new Promise((resolve, reject) => {
        getMessage().then(res => {
          const { unread, readed, trash } = res.data
          commit('setMessageUnreadList', unread.sort((a, b) => new Date(b.create_time) - new Date(a.create_time)))
          commit('setMessageReadedList', readed.map(_ => {
            _.loading = false
            return _
          }).sort((a, b) => new Date(b.create_time) - new Date(a.create_time)))
          commit('setMessageTrashList', trash.map(_ => {
            _.loading = false
            return _
          }).sort((a, b) => new Date(b.create_time) - new Date(a.create_time)))
          resolve()
        }).catch(error => {
          console.log(error)
          reject(error)
        })
      })
    },
    // ??????????????????????????????id????????????
    getContentByMsgId ({ state, commit }, { msg_id }) {
      return new Promise((resolve, reject) => {
        let contentItem = state.messageContentStore[msg_id]
        if (contentItem) {
          resolve(contentItem)
        } else {
          getContentByMsgId(msg_id).then(res => {
            const content = res.data
            commit('updateMessageContentStore', { msg_id, content })
            resolve(content)
          })
        }
      })
    },
    // ????????????????????????????????????
    hasRead ({ state, commit }, { msg_id }) {
      return new Promise((resolve, reject) => {
        hasRead(msg_id).then(() => {
          commit('moveMsg', {
            from: 'messageUnreadList',
            to: 'messageReadedList',
            msg_id
          })
          commit('setMessageCount', state.unreadCount - 1)
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },
    // ????????????????????????????????????
    removeReaded ({ commit }, { msg_id }) {
      return new Promise((resolve, reject) => {
        removeReaded(msg_id).then(() => {
          commit('moveMsg', {
            from: 'messageReadedList',
            to: 'messageTrashList',
            msg_id
          })
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },
    // ??????????????????????????????????????????
    restoreTrash ({ commit }, { msg_id }) {
      return new Promise((resolve, reject) => {
        restoreTrash(msg_id).then(() => {
          commit('moveMsg', {
            from: 'messageTrashList',
            to: 'messageReadedList',
            msg_id
          })
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    }
  }
}
