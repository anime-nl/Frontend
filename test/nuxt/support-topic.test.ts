import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises} from '@vue/test-utils'
import {mountSuspended, registerEndpoint} from '@nuxt/test-utils/runtime'
import {createError, readBody} from 'h3'
import SupportTopic from '~/pages/support/[topic].vue'

const submittedBodies: unknown[] = []
let apiFails = false

registerEndpoint('/api/support', {
    method: 'POST',
    handler: async (event) => {
        submittedBodies.push(await readBody(event))
        if (apiFails) {
            throw createError({statusCode: 500})
        }
        return {ok: true}
    }
})

beforeEach(() => {
    submittedBodies.length = 0
    apiFails = false
})

const mountTopic = (slug: string) => mountSuspended(SupportTopic, {route: `/support/${slug}`})

async function fillIn(wrapper: Awaited<ReturnType<typeof mountTopic>>, values: Record<string, string>) {
    for (const [field, value] of Object.entries(values)) {
        await wrapper.find(`[name="${field}"]`).setValue(value)
    }
}

const submit = async (wrapper: Awaited<ReturnType<typeof mountTopic>>) => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
}

describe('support topic page', () => {
    it('shows the title and intro of the topic', async () => {
        const wrapper = await mountTopic('returns')

        expect(wrapper.find('h1').text()).toBe('Returns & refunds')
        expect(wrapper.text()).toContain('You have 14 days to return an order.')
    })

    it('marks the order number as optional for payments only', async () => {
        const payments = await mountTopic('payments')
        const returns = await mountTopic('returns')

        expect(payments.text()).toContain('Optional')
        expect(returns.text()).not.toContain('Optional')
    })

    it('shows errors and sends nothing when the form is incomplete', async () => {
        const wrapper = await mountTopic('returns')

        await submit(wrapper)

        expect(wrapper.text()).toContain('Please enter your order number')
        expect(wrapper.text()).toContain('Please enter your name')
        expect(wrapper.text()).toContain('Please enter a valid email address')
        expect(wrapper.text()).toContain('Please describe how we can help')
        expect(submittedBodies).toEqual([])
    })

    it('sends the request with the topic and the default reason', async () => {
        const wrapper = await mountTopic('returns')

        await fillIn(wrapper, {
            orderNumber: '1001',
            name: 'Jan Jansen',
            email: 'jan@example.nl',
            message: 'Please help'
        })
        await submit(wrapper)

        expect(submittedBodies).toEqual([
            {
                topic: 'returns',
                name: 'Jan Jansen',
                email: 'jan@example.nl',
                orderNumber: '1001',
                reason: 'I want to return an item',
                message: 'Please help',
                website: ''
            }
        ])
        await vi.waitFor(() => expect(wrapper.text()).toContain('Message sent'))
        expect(wrapper.text()).toContain('jan@example.nl')
    })

    it('shows an error and keeps the form when sending fails', async () => {
        apiFails = true
        const wrapper = await mountTopic('payments')

        await fillIn(wrapper, {name: 'Jan', email: 'jan@example.nl', message: 'Help'})
        await submit(wrapper)

        await vi.waitFor(() => expect(wrapper.text()).toContain('Something went wrong while sending your message'))
        expect(wrapper.text()).toContain('info@animenl.nl')
        expect(wrapper.find('form').exists()).toBe(true)
    })
})
