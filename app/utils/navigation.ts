import type {NavigationMenuItem} from '@nuxt/ui'
import {bySeriesLink} from './search'

/** Matches useI18n()'s `t`, without pulling a vue-i18n type dependency into this plain module. */
export type Translator = (key: string) => string

/**
 * Builds the navbar's menu structure, with every label and description resolved for the current
 * locale. A function rather than a static constant because this module has no Vue/Nuxt context of
 * its own, so the caller must supply its own reactive translator and re-run this on locale change.
 * @param t Translation function, typically useI18n()'s `t`
 * @returns The navigation menu items
 */
export function buildNavigationItems(t: Translator): NavigationMenuItem[] {
    return [
        {
            label: t('nav.main.home.label'),
            icon: 'i-material-symbols:home',
            to: '/',
            class: 'px-6'
        },
        {
            label: t('nav.main.tcg.label'),
            icon: 'i-material-symbols-light:playing-cards',
            to: '/products/tcg',
            children: [
                {
                    label: t('nav.main.tcg.children.singles.label'),
                    description: t('nav.main.tcg.children.singles.description'),
                    icon: 'i-mdi-cards-playing-diamond',
                    to: '/products/tcg/singles'
                },
                {
                    label: t('nav.main.tcg.children.packs.label'),
                    description: t('nav.main.tcg.children.packs.description'),
                    icon: 'i-mdi-cards-playing-diamond',
                    to: '/products/tcg/packs'
                },
                {
                    label: t('nav.main.tcg.children.boosters.label'),
                    description: t('nav.main.tcg.children.boosters.description'),
                    icon: 'i-game-icons-ring-box',
                    to: '/products/tcg/boosters'
                },
                {
                    label: t('nav.main.tcg.children.bySeries.label'),
                    description: t('nav.main.tcg.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: bySeriesLink('tcg')
                }
            ]
        },
        {
            label: t('nav.main.figures.label'),
            icon: 'i-game-icons-hooded-figure',
            to: '/products/figures',
            children: [
                {
                    label: t('nav.main.figures.children.prizeFigures.label'),
                    description: t('nav.main.figures.children.prizeFigures.description'),
                    icon: 'i-mdi:trophy',
                    to: '/products/figures/prize-figures'
                },
                {
                    label: t('nav.main.figures.children.scaleFigures.label'),
                    description: t('nav.main.figures.children.scaleFigures.description'),
                    icon: 'i-mdi:ruler',
                    to: '/products/figures/scale-figures'
                },
                {
                    label: t('nav.main.figures.children.noodleStoppers.label'),
                    description: t('nav.main.figures.children.noodleStoppers.description'),
                    icon: 'i-mdi:cup',
                    to: '/products/figures/noodle-stoppers'
                },
                {
                    label: t('nav.main.figures.children.bySeries.label'),
                    description: t('nav.main.figures.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: bySeriesLink('figures')
                }
            ]
        },
        {
            label: t('nav.main.plush.label'),
            icon: 'i-mdi-teddy-bear',
            to: '/products/plush',
            children: [
                {
                    label: t('nav.main.plush.children.bySeries.label'),
                    description: t('nav.main.plush.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: bySeriesLink('plush')
                }
            ]
        },
        {
            label: t('nav.main.keychains.label'),
            icon: 'i-pinhead-key-with-house-keychain',
            to: '/products/keychains',
            children: [
                {
                    label: t('nav.main.keychains.children.acrylic.label'),
                    description: t('nav.main.keychains.children.acrylic.description'),
                    icon: 'i-at-icons:glass-pane',
                    to: '/products/keychains/acrylic'
                },
                {
                    label: t('nav.main.keychains.children.metal.label'),
                    description: t('nav.main.keychains.children.metal.description'),
                    icon: 'i-game-icons:metal-bar',
                    to: '/products/keychains/metal'
                },
                {
                    label: t('nav.main.keychains.children.bySeries.label'),
                    description: t('nav.main.keychains.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: bySeriesLink('keychains')
                }
            ]
        },
        {
            label: t('nav.main.support.label'),
            icon: 'i-lucide-life-buoy',
            to: '/support'
        },
        {
            label: t('nav.main.trustpilot.label'),
            icon: 'i-simple-icons-trustpilot',
            badge: '4.0',
            to: 'https://www.trustpilot.com/review/animenl.nl',
            target: '_blank'
        }
    ]
}
