// src/components/PasswordStrengthMeter.jsx
import { useState, useEffect } from 'react'

export default function PasswordStrengthMeter({ password }) {
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const calculateStrength = (password) => {
      let score = 0
      if (password.length >= 8) score++
      if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++
      if (password.match(/\d/)) score++
      if (password.match(/[^a-zA-Z\d]/)) score++
      return score
    }

    setStrength(calculateStrength(password))
  }, [password])

  const getColor = () => {
    switch (strength) {
      case 0: return 'bg-red-500'
      case 1: return 'bg-orange-500'
      case 2: return 'bg-yellow-500'
      case 3: return 'bg-blue-500'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-200'
    }
  }

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${getColor()}`} style={{ width: `${strength * 25}%` }}></div>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {strength === 0 && 'Very weak'}
        {strength === 1 && 'Weak'}
        {strength === 2 && 'Fair'}
        {strength === 3 && 'Good'}
        {strength === 4 && 'Strong'}
      </p>
    </div>
  )
}