import type {NavigationMenuItem} from '@nuxt/ui'
import {bySeriesLink} from './search'

/** Matches useI18n()'s `t`, without pulling a vue-i18n type dependency into this plain module. */
export type Translator = (key: string) => string

/**
 * Builds the navbar's menu structure, with every label and description resolved for the current
 * locale. A function rather than a static constant because this module has no Vue/Nuxt context of
 * its own, so the caller must supply its own reactive translator and re-run this on locale change.
 * @param t Translation function, typically useI18n()'s `t`
 * @param localePath Prefixes an internal path with the current locale, typically useLocalePath()
 * @returns The navigation menu items
 */
export function buildNavigationItems(t: Translator, localePath: (path: string) => string): NavigationMenuItem[] {
    return [
        {
            label: t('nav.main.home.label'),
            icon: 'i-material-symbols:home',
            to: localePath('/'),
            class: 'px-6'
        },
        {
            label: t('nav.main.tcg.label'),
            icon: 'i-material-symbols-light:playing-cards',
            to: localePath('/products/tcg'),
            children: [
                {
                    label: t('nav.main.tcg.children.singles.label'),
                    description: t('nav.main.tcg.children.singles.description'),
                    icon: 'i-mdi-cards-playing-diamond',
                    to: localePath('/products/tcg/singles')
                },
                {
                    label: t('nav.main.tcg.children.packs.label'),
                    description: t('nav.main.tcg.children.packs.description'),
                    icon: 'i-mdi-cards-playing-diamond',
                    to: localePath('/products/tcg/packs')
                },
                {
                    label: t('nav.main.tcg.children.boosters.label'),
                    description: t('nav.main.tcg.children.boosters.description'),
                    icon: 'i-game-icons-ring-box',
                    to: localePath('/products/tcg/boosters')
                },
                {
                    label: t('nav.main.tcg.children.bySeries.label'),
                    description: t('nav.main.tcg.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: localePath(bySeriesLink('tcg'))
                }
            ]
        },
        {
            label: t('nav.main.figures.label'),
            icon: 'i-game-icons-hooded-figure',
            to: localePath('/products/figures'),
            children: [
                {
                    label: t('nav.main.figures.children.prizeFigures.label'),
                    description: t('nav.main.figures.children.prizeFigures.description'),
                    icon: 'i-mdi:trophy',
                    to: localePath('/products/figures/prize-figures')
                },
                {
                    label: t('nav.main.figures.children.scaleFigures.label'),
                    description: t('nav.main.figures.children.scaleFigures.description'),
                    icon: 'i-mdi:ruler',
                    to: localePath('/products/figures/scale-figures')
                },
                {
                    label: t('nav.main.figures.children.noodleStoppers.label'),
                    description: t('nav.main.figures.children.noodleStoppers.description'),
                    icon: 'i-mdi:cup',
                    to: localePath('/products/figures/noodle-stoppers')
                },
                {
                    label: t('nav.main.figures.children.bySeries.label'),
                    description: t('nav.main.figures.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: localePath(bySeriesLink('figures'))
                }
            ]
        },
        {
            label: t('nav.main.plush.label'),
            icon: 'i-mdi-teddy-bear',
            to: localePath('/products/plush'),
            children: [
                {
                    label: t('nav.main.plush.children.bySeries.label'),
                    description: t('nav.main.plush.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: localePath(bySeriesLink('plush'))
                }
            ]
        },
        {
            label: t('nav.main.keychains.label'),
            icon: 'i-pinhead-key-with-house-keychain',
            to: localePath('/products/keychains'),
            children: [
                {
                    label: t('nav.main.keychains.children.acrylic.label'),
                    description: t('nav.main.keychains.children.acrylic.description'),
                    icon: 'i-at-icons:glass-pane',
                    to: localePath('/products/keychains/acrylic')
                },
                {
                    label: t('nav.main.keychains.children.metal.label'),
                    description: t('nav.main.keychains.children.metal.description'),
                    icon: 'i-game-icons:metal-bar',
                    to: localePath('/products/keychains/metal')
                },
                {
                    label: t('nav.main.keychains.children.bySeries.label'),
                    description: t('nav.main.keychains.children.bySeries.description'),
                    icon: 'i-mdi:magnify',
                    to: localePath(bySeriesLink('keychains'))
                }
            ]
        },
        {
            label: t('nav.main.support.label'),
            icon: 'i-lucide-life-buoy',
            to: localePath('/support')
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
