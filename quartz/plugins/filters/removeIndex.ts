import { QuartzFilterPlugin } from "../types"

// Drops the content-derived root index page so it never reaches the emit phase.
// The AcademicLanding emitter owns `/` and synthesizes index.html from data/ —
// without this filter, ContentPage would also emit index.html and the two race
// (emitters run via Promise.all). This filter makes ownership deterministic
// regardless of the content source, so it works in CI where content/ comes from
// a separate repo whose index.md is not marked draft.
export const RemoveIndexPage: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveIndexPage",
  shouldPublish(_ctx, [_tree, vfile]) {
    return vfile.data?.slug !== "index"
  },
})
