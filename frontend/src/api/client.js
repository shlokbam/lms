import axios from 'axios'

const client = axios.create({ baseURL: '/' })

// Attach JWT to every request
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('eagle_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-logout on 401
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eagle_token')
      localStorage.removeItem('eagle_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
