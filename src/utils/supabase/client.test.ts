import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from './client'

// Mocking 'process.env' specifically for Next.js behavior mapping
describe('Supabase Client Environment Configuration', () => {
    const originalEnv = process.env

    beforeEach(() => {
        vi.resetModules()
        process.env = { ...originalEnv }
    })

    it('should throw an error or handle initialization safely if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = ''
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

        expect(() => createClient()).toThrowError()
    })

    it('should throw an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

        expect(() => createClient()).toThrowError()
    })

    it('should successfully initialize when both environment variables are provided', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

        const client = createClient()
        expect(client).toBeDefined()
    })
})
