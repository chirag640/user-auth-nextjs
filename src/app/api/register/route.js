// src/app/api/register/route.js
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import { v2 as cloudinary } from 'cloudinary'
import nodemailer from 'nodemailer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  })        

export async function POST(req) {
  try {
    const { fullName, username, phoneNumber, email, password, profilePicture } = await req.json()

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }, { phoneNumber }]
    })

    if (existingUser) {
      return NextResponse.json({ errors: { submit: 'Username, email, or phone number already exists' } }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Upload profile picture to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
      folder: 'profile_pictures',
      resource_type: 'image',
    });
    

    // Create a new user
    const newUser = {
      fullName,
      username,
      phoneNumber,
      email,
      password: hashedPassword,
      profilePicture: uploadResponse.secure_url,
      isVerified: false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit code
      createdAt: new Date()
    }

    await db.collection('users').insertOne(newUser)

    // Send verification email (implement this function)
    await sendVerificationEmail(email, newUser.verificationCode, fullName)

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ errors: { submit: 'An error occurred during registration' } }, { status: 500 })
  }
}

async function sendVerificationEmail(email, code, fullName) {
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Verify Your Email',
        html: `
          <h1>Email Verification</h1>
          <p>Hello ${fullName},</p>
          <p>Thank you for registering. Please use the following code to verify your email:</p>
          <h2>${code}</h2>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      })
      console.log(`Verification email sent to ${email}`)
    } catch (error) {
      console.error('Error sending verification email:', error)
      throw new Error('Failed to send verification email')
    }
  }