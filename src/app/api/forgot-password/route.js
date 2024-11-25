// src/app/api/forgot-password/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(req) {
  try {
    const { identifier } = await req.json()

    const { db } = await connectToDatabase()

    // Find user by email or username
    const user = await db.collection('users').findOne({
      $or: [{ email: identifier }, { username: identifier }]
    })

    if (!user) {
      return NextResponse.json({ error: 'No account found with that email or username' }, { status: 404 })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000 // 1 hour from now

    // Update user with reset token and expiry
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    )

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    })

    return NextResponse.json({ message: 'Password reset email sent' }, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 })
  }
}