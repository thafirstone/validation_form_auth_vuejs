import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth'
import router from './router'
import globalAxios from 'axios'
import config from './firebase.config'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null
  },
  mutations: {
    authUser (state, userData) {
      state.idToken = userData.idToken
      state.userId = userData.localId
    },
    storeUser (state, user) {
      state.user = user
    },
    clearAuthData (state) {
      state.idToken = null
      state.userId = null
    }
  },
  actions: {
    setLogoutTimer ({ commit, dispatch }, expirationTime) {
      setTimeout(() => {
        commit('clearAuthData')
        router.replace('/signin')
      },
      expirationTime * 1000)
    },
    signup ({ commit, dispatch }, authData) {
      axios
        .post(`/signupNewUser?key=${config.apiKey}`, {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
          console.log(res)
          commit('authUser', res.data)
          const now = new Date()
          const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
          localStorage.setItem('token', res.data.idToken)
          localStorage.setItem('userId', res.data.localId)
          localStorage.setItem('expirationDate', expirationDate)
          dispatch('storeUser', authData)
          dispatch('setLogoutTimer', res.data.expiresIn)
          router.replace('/dashboard')
        })
        .catch(error => console.log(error))
    },
    login ({ commit, dispatch }, authData) {
      axios
        .post(`/verifyPassword?key=${config.apiKey}`, {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
          console.log(res)
          const now = new Date()
          const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
          localStorage.setItem('token', res.data.idToken)
          localStorage.setItem('userId', res.data.localId)
          localStorage.setItem('expirationDate', expirationDate)
          commit('authUser', res.data)
          dispatch('setLogoutTimer', res.data.expiresIn)
          router.replace('/dashboard')
        })
        .catch(error => console.log(error))
    },
    tryAutoLogin ({commit}) {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }
      const expirationDate = localStorage.getItem('expirationDate')
      const now = new Date()
      if (now >= expirationDate) {

      }
      const userId = localStorage.getItem('userId')
      if (!userId) {
        return
      }
      commit('authUser', {idToken: token, userId: userId})
      router.replace('/dashboard')
    },
    logout ({ commit }, authData) {
      commit('clearAuthData')
      localStorage.removeItem('token')
      localStorage.removeItem('expirationDate')
      localStorage.removeItem('userId')
      router.replace('/signin')
    },
    storeUser ({ commit, state }, userData) {
      if (!state.idToken) {
        return
      }
      console.log('data idToken exists')
      globalAxios
        .post(`/users.json?auth=${state.idToken}`, userData)
        .then(res => {
          console.log(res)
        })
        .catch(error => console.log(error))
    },
    fetchUser ({ commit, state }, authData) {
      if (!state.idToken) {
        return
      }
      globalAxios
        .get(`/users.json?auth=${state.idToken}`)
        .then(res => {
          console.log(res)
          const data = res.data
          const users = []
          for (let key in data) {
            const user = data[key]
            user.id = key
            users.push(user)
            commit('storeUser', users[0])
          }
          console.log(users)
          this.email = users[0].email
        })
        .catch(error => console.log(error))
    }
  },
  getters: {
    idToken: state => state.idToken,
    userId: state => state.userId,
    user: state => state.user,
    isAuthenticated: state => state.idToken !== null
  }
})
