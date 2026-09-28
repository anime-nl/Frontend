// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // medusa/ is a separate backend used only for local dev (see AGENTS.md); it has its own
    // toolchain and generated types, and isn't part of this app's deployment or lint scope
    ignores: ['medusa/**']
  },
  {
    rules: {
      // Purely stylistic and fought by Prettier's own opinion on self-closing tags; Prettier is
      // the formatting authority per AGENTS.md
      'vue/html-self-closing': 'off'
    }
  },
  {
    files: ['app/components/navbar.vue'],
    rules: {
      // Navbar is a deliberate single-instance layout component, not a reusable one that risks
      // colliding with a native HTML element
      'vue/multi-word-component-names': 'off'
    }
  }
)
