import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Vuetify 3 imports
import 'vuetify/styles' // Import des styles de Vuetify
import { createVuetify } from 'vuetify' // Import de Vuetify
import '@mdi/font/css/materialdesignicons.css' // Optionnel : icônes Material Design
import 'roboto-fontface/css/roboto/roboto-fontface.css' // Optionnel : police Roboto
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi' // Importez l'ensemble d'icônes MDI

// Icon & font
import { fa } from 'vuetify/iconsets/fa-svg'
import { library } from '@fortawesome/fontawesome-svg-core'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'

import "@/styles/global.scss";

const vuetify = createVuetify({
    components,
    directives,
    iconfont: 'mdi',
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
            fa,
        },
    },
})


// Includes needed icons
library.add(fas)
library.add(fab)
library.add(far)


createApp(App)
    .use(vuetify)
    .use(store)
    .use(router)
    .mount('#app')