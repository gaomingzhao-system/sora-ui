import { createVaporApp } from 'vue'
// The one documented stylesheet import. No Tailwind is installed in this app.
import '@your-scope/ui/styles.css'
import './app.css'
import App from './App.vue'
import { ui } from './i18n'

const app = createVaporApp(App)
app.use(ui.i18n)
app.mount('#app')
