import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  return (
    <div className="app-wrap">
      <Sidebar />
      <div className="main" id="main">
        <Topbar />
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
