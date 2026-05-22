import React from 'react'
import Link from 'next/link'
import Navbar from './components/Navbar'

const page = () => {
  return (
    <div className="">
      <Navbar />  
      <Link href="/login" className="sans text-white  font-bold text-sm px-3 rounded-md py-2.5 blue">
        Login
      </Link>
    </div>
  )
}

export default page