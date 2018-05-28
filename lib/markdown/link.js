// markdown-it plugin for:
// 1. adding target="_blank" to external links
// 2. converting internal links to <router-link>

const { URL } = require("url")

const externalLinkTest = /^https?:/;
const sourceLinkTest = /(\/|\.md|\.html)(#.*)?$/;

module.exports = md => {
  let hasOpenRouterLink = false

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const hrefIndex = token.attrIndex('href')
    if (hrefIndex >= 0) {
      const link = token.attrs[hrefIndex]
      const href = link[1]
      const {staticFilesExtensionsTest} = env;

      const isExternal = externalLinkTest.test(href)
      const isSourceLink = sourceLinkTest.test(href)
      const isStaticFile = staticFilesExtensionsTest ? staticFilesExtensionsTest.test(href) : false;
      if (isExternal | isStaticFile) {
        addAttr(token, 'target', '_blank')
        addAttr(token, 'rel', 'noopener noreferrer')
        if (isStaticFile) {
          token.attrs[hrefIndex][1] = resolveGithubFileURL(env, href);
        }
      } else if (isSourceLink) {
        hasOpenRouterLink = true
        tokens[idx] = toRouterLink(token, link)
      }
    }
    return self.renderToken(tokens, idx, options)
  }

  function toRouterLink (token, link) {
    link[0] = 'to'
    let to = link[1]

    // convert link to filename and export it for existence check
    const links = md.__data.links || (md.__data.links = [])
    links.push(to)

    to = to
      .replace(/\.md$/, '.html')
      .replace(/\.md(#.*)$/, '.html$1')
      .replace(/^index|readme\.html/ig, '');
    // normalize links to README/index
    // if (/^index|readme\.html/i.test(to)) {
    //   to = '/'
    // }
    // markdown-it encodes the uri
    link[1] = decodeURI(to)
    return Object.assign({}, token, {
      tag: 'router-link'
    })
  }

  md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (hasOpenRouterLink) {
      token.tag = 'router-link'
      hasOpenRouterLink = false
    }
    return self.renderToken(tokens, idx, options)
  }
}

function resolveGithubFileURL(env, href) {
  let branch = env.branch ? encodeURIComponent(env.branch) : "master";
  let repoUrl = env.repository;
  let githubRepoBaseURL = `https://github.com/${repoUrl}/blob/${branch}/`;
  let fileUrl = new URL(env.filepath, githubRepoBaseURL);
  let newUrl = new URL(href, fileUrl);
  return newUrl.href;
}

function addAttr (token, name, val) {
  const targetIndex = token.attrIndex(name)
  if (targetIndex < 0) {
    token.attrPush([name, val])
  } else {
    token.attrs[targetIndex][1] = val
  }
}
