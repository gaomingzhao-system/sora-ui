/**
 * `?compiled` imports are resolved by scripts/compiled-messages-plugin.ts to
 * a dictionary of precompiled messages. (Ambient: this file must stay free
 * of imports and exports.)
 */
declare module '*?compiled' {
  const messages: Readonly<Record<string, unknown>>
  export default messages
}
