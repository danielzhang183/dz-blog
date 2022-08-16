import { resolve } from 'path'
import fs from 'fs-extra'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import generateSitemap from 'vite-ssg-sitemap'
import Markdown from 'vite-plugin-vue-markdown'
import LinkAttributes from 'markdown-it-link-attributes'
import Unocss from 'unocss/vite'
import Shiki from 'markdown-it-shiki'
import matter from 'gray-matter'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'src')}/`,
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      '@vueuse/core',
      'dayjs',
      'dayjs/plugin/localizedFormat',
    ],
  },
  plugins: [
    // https://github.com/antfu/unocss
    Unocss(),
    vue({
      include: [/\.vue$/, /\.md$/],
    }),
    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
      extendRoute(route) {
        const path = resolve(__dirname, route.component.slice(1))

        if (!path.includes('projects.md')) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data } = matter(md)
          route.meta = Object.assign(route.meta || {}, { frontmatter: data })
        }

        return route
      },
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      // global imports to register
      imports: [
        'vue',
        'vue/macros',
        'vue-router',
        '@vueuse/head',
        '@vueuse/core',
      ],
      // Auto import for module exports under directories
      // by default it only scan one level of modules under the directory
      dirs: [
        './src/logics', // only root modules
      ],
      // Filepath to generate corresponding .d.ts file.
      // Defaults to './auto-imports.d.ts' when `typescript` is installed locally.
      // Set `false` to disable.
      dts: true,
      // Auto import inside Vue template
      // see https://github.com/unjs/unimport/pull/15 and https://github.com/unjs/unimport/pull/72
      vueTemplate: true,
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],
      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: true,
    }),
    // https://github.com/antfu/vite-plugin-vue-markdown
    Markdown({
      wrapperClasses: 'prose prose-sm m-auto text-left',
      headEnabled: true,
      markdownItSetup(md) {
        // https://prismjs.com/
        md.use(Shiki, {
          theme: {
            light: 'vitesse-light',
            dark: 'vitesse-dark',
          },
        })
        md.use(LinkAttributes, {
          matcher: (link: string) => /^https?:\/\//.test(link),
          attrs: {
            target: '_blank',
            rel: 'noopener',
          },
        })
      },
    }),
  ],

  // https://github.com/antfu/vite-ssg
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    onFinished() { generateSitemap() },
  },
})
