import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Prevent Next.js from aggressively caching this API route
export const dynamic = 'force-dynamic'

const REVIEWS_FILE = path.join(process.cwd(), 'reviews.json')

interface Review {
    id: string
    name: string
    message: string
    rating: number
    date: string
}

async function getReviews(): Promise<Review[]> {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf-8')
        return JSON.parse(data)
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []
        }
        throw error
    }
}

export async function GET() {
    try {
        const reviews = await getReviews()
        // Sort newest first and limit to 50
        const sorted = reviews
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50)

        return NextResponse.json(sorted)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        let { name, message, rating } = body

        // Sanitize inputs
        name = typeof name === 'string' ? name.trim() : ''
        message = typeof message === 'string' ? message.trim() : ''
        rating = Number(rating)

        // Validation
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (name.length > 50) return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })

        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        if (message.length > 500) return NextResponse.json({ error: 'Message must be 500 characters or less' }, { status: 400 })

        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
        }

        const reviews = await getReviews()

        const newReview: Review = {
            id: crypto.randomUUID(),
            name,
            message,
            rating,
            date: new Date().toISOString()
        }

        reviews.push(newReview)

        // Save to local file
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8')

        return NextResponse.json(newReview, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }
}
