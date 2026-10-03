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
    it('answers 404 for an unknown topic', async () => {
        await expect(mountTopic('unknown-topic')).rejects.toThrow()
    })

    it('shows the title and intro of the topic, in the default (Dutch) locale', async () => {
        const wrapper = await mountTopic('returns')

        expect(wrapper.find('h1').text()).toBe('Retourneren & terugbetalen')
        expect(wrapper.text()).toContain('Je hebt 14 dagen om een bestelling te retourneren.')
    })

    it('sets a page title and meta description for search engines', async () => {
        await mountTopic('returns')

        await vi.waitFor(() => expect(document.title).toBe('Retourneren & terugbetalen | Support | AnimeNL'))
        expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
            'Je hebt 14 dagen om een bestelling te retourneren.'
        )
    })

    it('marks the order number as optional for payments only', async () => {
        const payments = await mountTopic('payments')
        const returns = await mountTopic('returns')

        expect(payments.text()).toContain('Optioneel')
        expect(returns.text()).not.toContain('Optioneel')
    })

    it('shows errors and sends nothing when the form is incomplete', async () => {
        const wrapper = await mountTopic('returns')

        await submit(wrapper)

        expect(wrapper.text()).toContain('Dit veld is verplicht.')
        expect(wrapper.text()).toContain('Vul een geldig e-mailadres in.')
        expect(submittedBodies).toEqual([])
    })

    it('sends the request with the topic and the default reason key', async () => {
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
                reason: 'wantToReturn',
                message: 'Please help',
                website: ''
            }
        ])
        await vi.waitFor(() => expect(wrapper.text()).toContain('Bericht verzonden'))
        expect(wrapper.text()).toContain('jan@example.nl')
    })

    it('sends the chosen reason key instead of the default one', async () => {
        const wrapper = await mountTopic('returns')

        await fillIn(wrapper, {
            orderNumber: '1001',
            name: 'Jan Jansen',
            email: 'jan@example.nl',
            message: 'Please help'
        })
        await wrapper.find('[name="reason"]').setValue('arrivedDamaged')
        await submit(wrapper)

        expect(submittedBodies).toEqual([expect.objectContaining({reason: 'arrivedDamaged'})])
    })

    it('sends whatever a bot fills into the hidden honeypot field', async () => {
        const wrapper = await mountTopic('returns')

        await fillIn(wrapper, {
            orderNumber: '1001',
            name: 'Jan Jansen',
            email: 'jan@example.nl',
            message: 'Please help',
            website: 'https://spam.example'
        })
        await submit(wrapper)

        expect(submittedBodies).toEqual([expect.objectContaining({website: 'https://spam.example'})])
    })

    it('shows an error and keeps the form when sending fails', async () => {
        apiFails = true
        const wrapper = await mountTopic('payments')

        await fillIn(wrapper, {name: 'Jan', email: 'jan@example.nl', message: 'Help'})
        await submit(wrapper)

        await vi.waitFor(() => expect(wrapper.text()).toContain('Er ging iets mis bij het verzenden van je bericht'))
        expect(wrapper.text()).toContain('info@animenl.nl')
        expect(wrapper.find('form').exists()).toBe(true)
    })
})
