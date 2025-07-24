import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ParticleBackground from '../ParticleBackground'

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <ParticleBackground />
      <Sidebar />
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout