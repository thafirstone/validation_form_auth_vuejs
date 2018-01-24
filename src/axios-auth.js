import axios from 'axios'
import config from './firebase.config'

const instance = axios.create({
  baseURL: config.restAPI
})

// instance.defaults.headers.common['SOMETHING'] = 'something'

export default instance
