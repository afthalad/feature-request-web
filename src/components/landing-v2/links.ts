/** While v2 is a preview its links stay inside v2: the home is /home-v2 and /docs/* is /docs-preview/*. */
export const V2_HOME = "/home-v2";

/** Maps a live docs link to its docs-v2 twin. */
export function v2Docs(href: string) {
  return href.replace(/^\/docs(?=\/|$|#)/, "/docs-preview");
}
