import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// AJUSTE: substitua 'gip' pelo nome exato do seu repositório GitHub
// Exemplo: se o repo for github.com/usuario/meu-projeto → base: '/meu-projeto/'
const REPO_NAME = 'gip'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: `/${REPO_NAME}/`,
})
