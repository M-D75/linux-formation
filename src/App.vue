<script setup>
    import { computed } from 'vue'
    import { RouterView } from 'vue-router'
    import { availableLocales, currentLocale, setLocale, t } from './i18n'
    // import HelloWorld from './components/HelloWorld.vue'

    const selectedLocale = computed({
        get: () => currentLocale.value,
        set: (locale) => setLocale(locale),
    })
</script>

<template>
    <v-app>
        <div class="language-switcher">
            <span class="language-switcher__label">{{ t('app.language') }}</span>
            <v-btn-toggle
                v-model="selectedLocale"
                mandatory
                density="compact"
                variant="outlined"
                color="primary"
                divided
            >
                <v-btn
                    v-for="locale in availableLocales"
                    :key="locale.code"
                    :value="locale.code"
                    size="small"
                    :aria-label="locale.name"
                >
                    {{ locale.label }}
                </v-btn>
            </v-btn-toggle>
        </div>
        <RouterView />
        <v-footer class="app-footer" padless>
            <div class="footer-content">
                {{ t('app.footerSoundEffect') }}
                 <!-- by
                <a
                    href="https://pixabay.com/fr/users/fnx_sound-44436577/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=287651"
                    target="_blank"
                    rel="noopener"
                >
                    Yhomar Frhiss Cueva Oviedo
                </a> -->
                {{ t('app.footerFrom') }}
                <a
                    href="https://pixabay.com/fr/sound-effects"
                    target="_blank"
                    rel="noopener"
                >
                    Pixabay
                </a>
            </div>
        </v-footer>
    </v-app>
</template>

<style scoped>
    header {
        line-height: 1.5;
        max-height: 100vh;
    }

    .language-switcher {
        position: relative;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 8px;
        width: fit-content;
        margin: 12px 14px 0 auto;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 6px 18px rgba(10, 29, 39, 0.14);
    }

    .language-switcher__label {
        color: #173847;
        font-size: 0.78rem;
        font-weight: 600;
    }

    .app-footer {
        /* background-color: rgba(0, 0, 0, 0.85); */
        color: #33333399;
        padding: 12px 20px;
        font-size: 0.8rem;
        justify-content: center;
        /* no decoration a */
        text-decoration: none;
    }

    .footer-content {
        text-align: center;
    }

    .app-footer a {
        color: #33333399;
        text-decoration: underline;
    }

    @media (max-width: 680px) {
        .language-switcher {
            margin-right: 10px;
        }

        .language-switcher__label {
            display: none;
        }
    }

    .logo {
    display: block;
    margin: 0 auto 2rem;
    }

    nav {
    width: 100%;
    font-size: 12px;
    text-align: center;
    margin-top: 2rem;
    }

    nav a.router-link-exact-active {
    color: var(--color-text);
    }

    nav a.router-link-exact-active:hover {
    background-color: transparent;
    }

    nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
    }

    nav a:first-of-type {
    border: 0;
    }

    @media (min-width: 1024px) {
    header {
        display: flex;
        place-items: center;
        padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
        margin: 0 2rem 0 0;
    }

    header .wrapper {
        display: flex;
        place-items: flex-start;
        flex-wrap: wrap;
    }

    nav {
        text-align: left;
        margin-left: -1rem;
        font-size: 1rem;

        padding: 1rem 0;
        margin-top: 1rem;
    }
    }
</style>
