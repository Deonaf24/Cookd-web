import React from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
