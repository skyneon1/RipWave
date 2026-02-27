'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Loader2, CheckCircle } from 'lucide-react'

// Types
interface Review {
    id: string
    name: string
    message: string
    rating: number
    date: string
}

// Format relative time: "2 hours ago", "3 days ago"
function timeAgo(dateString: string) {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'
    return Math.floor(seconds) + ' seconds ago'
}

// Generate deterministric colored gradients based on the username
function getAvatarColor(name: string) {
    const colors = [
        'from-red-500 to-red-400', 'from-blue-500 to-blue-400',
        'from-green-500 to-green-400', 'from-yellow-500 to-yellow-400',
        'from-purple-500 to-purple-400', 'from-pink-500 to-pink-400',
        'from-indigo-500 to-indigo-400', 'from-teal-500 to-teal-400'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')
    const [rating, setRating] = useState(5)
    const [hoverRating, setHoverRating] = useState(0)

    // Submission State
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<{ [key: string]: string }>({})
    const [success, setSuccess] = useState(false)

    // Computed Stats
    const totalReviews = reviews.length
    const avgRating = totalReviews > 0
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
        : '0.0'

    useEffect(() => {
        fetchReviews()
    }, [])

    async function fetchReviews() {
        try {
            const res = await fetch('/api/reviews')
            if (res.ok) {
                const data = await res.json()
                setReviews(data)
            }
        } catch (err) {
            console.error('Failed to fetch reviews', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Reset validations and state
        setError({})
        setSuccess(false)

        // Client-side validation
        const newErrors: { [key: string]: string } = {}
        if (!name.trim()) newErrors.name = 'Name is required'
        else if (name.trim().length > 50) newErrors.name = 'Max 50 characters'

        if (!message.trim()) newErrors.message = 'Message is required'
        else if (message.trim().length > 500) newErrors.message = 'Max 500 characters'

        if (Object.keys(newErrors).length > 0) {
            setError(newErrors)
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), message: message.trim(), rating })
            })

            const data = await res.json()

            if (!res.ok) {
                setError({ submit: data.error || 'Failed to submit review' })
            } else {
                setSuccess(true)
                setName('')
                setMessage('')
                setRating(5)
                setHoverRating(0)

                // Optimistic UI update avoiding page refresh
                setReviews(prev => [data, ...prev].slice(0, 50))

                // Hide success message after 3s
                setTimeout(() => setSuccess(false), 3000)
            }
        } catch (err) {
            setError({ submit: 'Something went wrong. Try again later.' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="py-24 px-4 border-t border-rip-border/50 bg-rip-bg relative">
            <div className="max-w-7xl mx-auto">

                {/* SECTION WRAPPER: Header */}
                <div className="text-center mb-16 space-y-3">
                    <p className="text-xs font-mono tracking-widest text-rip-accent mb-3">COMMUNITY</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-widest text-rip-text">
                            WHAT PEOPLE SAY
                        </h2>
                        {totalReviews > 0 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rip-border bg-rip-surface/60 backdrop-blur-sm text-sm font-semibold text-rip-text">
                                <span className="text-rip-accent flex items-center">{avgRating} ★</span>
                                <span className="text-rip-muted">·</span>
                                <span className="text-rip-subtext">{totalReviews} reviews</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start">

                    {/* SUBMIT FORM */}
                    <div className="lg:col-span-4 h-fit sticky top-24">
                        <div className="rounded-2xl border border-rip-border bg-rip-surface/60 backdrop-blur-sm p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-rip-accent/5 blur-[80px] pointer-events-none" />

                            <h3 className="text-xl font-semibold text-rip-text mb-6 relative z-10">Leave a Review</h3>

                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                {/* Rating component */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-rip-subtext">Rating</label>
                                    <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rip-accent rounded-md transition-transform hover:scale-110"
                                            >
                                                <span className={`text-2xl transition-all duration-200 ${(hoverRating || rating) >= star ? 'text-rip-accent drop-shadow-[0_0_8px_rgba(255,77,28,0.5)]' : 'text-rip-muted'}`}>
                                                    {(hoverRating || rating) >= star ? '★' : '☆'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-rip-subtext">Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        className="w-full px-4 py-3 rounded-xl bg-rip-bg border border-rip-border text-rip-text placeholder:text-rip-muted focus:border-rip-accent/50 focus:ring-1 focus:ring-rip-accent/50 focus:shadow-[0_0_15px_rgba(255,77,28,0.1)] outline-none transition-all duration-200"
                                    />
                                    {error.name && <p className="text-red-400 text-xs">{error.name}</p>}
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label htmlFor="message" className="text-sm font-medium text-rip-subtext">Message</label>
                                        <span className="text-xs text-rip-subtext font-mono">{message.length} / 500</span>
                                    </div>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="How was your experience?"
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-rip-bg border border-rip-border text-rip-text placeholder:text-rip-muted focus:border-rip-accent/50 focus:ring-1 focus:ring-rip-accent/50 focus:shadow-[0_0_15px_rgba(255,77,28,0.1)] outline-none resize-none transition-all duration-200"
                                    />
                                    {error.message && <p className="text-red-400 text-xs">{error.message}</p>}
                                </div>

                                {/* External Form Error */}
                                {error.submit && <p className="text-red-400 text-sm">{error.submit}</p>}

                                {/* Submit button logic & Toast Overlay */}
                                <div className="pt-2 relative">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rip-accent to-rip-accent-2 text-white font-medium hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,77,28,0.4)] glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Posting...
                                            </>
                                        ) : (
                                            'Post Review'
                                        )}
                                    </button>

                                    {/* Form Success Indicator */}
                                    <div className={`absolute inset-x-0 bottom-0 pointer-events-none flex items-center justify-center pt-2 transition-all duration-300 ${success ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm shadow-[0_0_15px_rgba(34,197,94,0.1)] backdrop-blur-md">
                                            <CheckCircle size={16} />
                                            Review posted!
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* DISPLAY SECTION: masonry-style grid */}
                    <div className="lg:col-span-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-rip-subtext">
                                <Loader2 size={32} className="animate-spin text-rip-accent mb-4" />
                                <p>Loading reviews...</p>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-rip-border/50 bg-rip-surface/20">
                                <div className="w-16 h-16 rounded-full bg-rip-surface flex items-center justify-center border border-rip-border mb-4">
                                    <MessageSquare size={24} className="text-rip-subtext" />
                                </div>
                                <h4 className="text-rip-text font-medium mb-1">No reviews yet</h4>
                                <p className="text-rip-subtext text-sm max-w-sm">
                                    Be the first to share your experience with Ripwave!
                                </p>
                            </div>
                        ) : (
                            <div className="columns-1 md:columns-2 gap-6 space-y-6">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="break-inside-avoid relative rounded-2xl border border-rip-border bg-rip-surface/40 p-5 shadow-sm hover:shadow-[0_0_20px_rgba(255,77,28,0.15)] hover:-translate-y-1 hover:border-rip-accent/50 transition-all duration-300 group overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-br ${getAvatarColor(review.name)} ring-2 ring-rip-bg`}>
                                                    {review.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-rip-text text-sm leading-tight line-clamp-1">{review.name}</p>
                                                    <p className="text-xs text-rip-muted mt-0.5">{timeAgo(review.date)}</p>
                                                </div>
                                            </div>
                                            <div className="flex -mt-1 -mr-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={`text-base tracking-[-0.1em] ${star <= review.rating ? 'text-rip-accent drop-shadow-[0_0_5px_rgba(255,77,28,0.3)]' : 'text-rip-muted/40'}`}>
                                                        {star <= review.rating ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-rip-subtext group-hover:text-rip-text transition-colors text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                                            {review.message}
                                        </p>
                                        {/* Bottom subtle line matching accent on hover */}
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rip-accent/0 via-rip-accent/40 to-rip-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
