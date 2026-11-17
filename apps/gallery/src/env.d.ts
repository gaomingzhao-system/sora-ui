/// <reference types="vite/client" />

declare module '*?compiled' {
  const messages: Readonly<Record<string, unknown>>
  export default messages
}
