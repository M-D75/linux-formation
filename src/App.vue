<script setup>
    import { RouterView } from 'vue-router'
    // import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
    <v-app>
        <RouterView />
        <v-footer class="app-footer" padless>
            <div class="footer-content">
                Sound Effect
                 <!-- by
                <a
                    href="https://pixabay.com/fr/users/fnx_sound-44436577/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=287651"
                    target="_blank"
                    rel="noopener"
                >
                    Yhomar Frhiss Cueva Oviedo
                </a> -->
                from
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
