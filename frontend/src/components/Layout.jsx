import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="lg:ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
