import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/app/api/lib/db'

export const dynamic = 'force-dynamic'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, phoneNumber, location, gender, age } = newsletterSchema.parse(body)

    const existingUser = await db.betaSignup.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered for beta' },
        { status: 409 }
      )
    }

    await db.betaSignup.create({
      data: {
        email,
        name,
        phoneNumber,
        location,
        gender,
        age,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Successfully registered for beta!' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json(
      { success: false, message: 'Email parameter is required' },
      { status: 400 }
    )
  }

  try {
    const subscription = await db.betaSignup.findUnique({
      where: { email },
    })

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch beta registration status' },
      { status: 500 }
    )
  }
}