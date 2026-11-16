import { createVaporApp } from 'vue'
// The library stylesheet first, then the host's Tailwind entry. The order does
// not matter for the cascade (see the layer contract in the library CSS).
import '@your-scope/ui/styles.css'
import './styles.css'
import App from './App.vue'
import { galleryI18n, isGalleryLocale } from './i18n.ts'

const params = new URLSearchParams(location.search)
const requested = params.get('locale')
if (isGalleryLocale(requested) && requested !== 'en') await galleryI18n.setLocale(requested)

const app = createVaporApp(App)
// Installing the instance is optional for the library (it only needs the
// translator passed to SoraProvider), but it is what an application using
// `useI18n()` in its own components would do.
app.use(galleryI18n.i18n)
app.mount('#app')
