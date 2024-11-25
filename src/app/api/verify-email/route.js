    // src/app/api/verify-email/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(req) {
  try {
    const { email, code } = await req.json()

    // Connect to the database
    const { db } = await connectToDatabase()

    // Find the user by email and verification code
    const user = await db.collection('users').findOne({ email, verificationCode: code })

    if (!user) {
      return NextResponse.json({ errors: { submit: 'Invalid verification code' } }, { status: 400 })
    }

    // Mark the user as verified
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { isVerified: true }, $unset: { verificationCode: "" } }
    )

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ errors: { submit: 'An error occurred during email verification' } }, { status: 500 })
  }
}