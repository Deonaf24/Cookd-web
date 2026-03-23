import React from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
      <Navbar />
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
