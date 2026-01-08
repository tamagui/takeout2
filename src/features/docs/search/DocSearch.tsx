import '@docsearch/css'

import { DocSearchModal } from '@docsearch/react'

import type { DocSearchModalProps } from '@docsearch/react'

export default function DocSearch(props: DocSearchModalProps) {
  return (
    <>
      <style href="docsearch" precedence="default">
        {docSearchCSS}
      </style>
      <DocSearchModal {...props} />
    </>
  )
}

const docSearchCSS = `
:root{
font-family: sans-serif;
.DocSearch {
  --docsearch-primary-color: var(--color11);
  --docsearch-highlight-color: var(--color);
  --docsearch-text-color: var(--color);
  --docsearch-modal-background: var(--background);
  --docsearch-searchbox-shadow: none;
  --docsearch-searchbox-background: transparent;
  --docsearch-searchbox-focus-background: transparent;
  --docsearch-hit-color: var(--color);
  --docsearch-muted-color: var(--colorFocus);
  --docsearch-logo-color: var(--colorPress);
  --docsearch-footer-background: transparent;
  --docsearch-footer-shadow: none;
  --docsearch-modal-shadow: inset 0 0 1px 1px var(--borderColor), 0 5px 20px 0 var(--shadowColor);
  z-index: 10000000;
}

.DocSearch-Container {
  background-color: var(--background075)
}

.DocSearch-Modal {
  background-color: var(--color2);
  max-width: 500px;
}

.DocSearch-Hit a {
  background: var(--background);
  box-shadow: none !important;
}

.DocSearch-Hit[aria-selected=true] a {
  background: var(--color4);
}

.DocSearch-Modal {
  border-radius: 10px;
}

.DocSearch-SearchBar {
  border-bottom: 0.5px solid var(--borderColor);
  padding-left: var(--space-1);
  padding-right: var(--space-1);
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
  font-size: var(--size-3);
  font-family: var(--f-family) !important;
}

@media (max-width: 750px) {
  .DocSearch-Modal {
    margin: 10px;
    width: auto;
    height: auto;
    flex: 1;
  }
}

.DocSearch-Cancel {
  font-size: 12px;
  padding: 20px;
  opacity: 0.5;
  margin-right: var(--space-2);
  font-family: sans-serif;
}

.DocSearch-Container {
  backdrop-filter: blur(5px);
}

.DocSearch-Label,
.DocSearch-Help,
.DocSearch-NoResults,
.DocSearch-Footer,
.DocSearch-Reset {
  color: var(--color12);
}

.DocSearch-Input {
  font-size: 16px;
  font-family: sans-serif;
}

.DocSearch-Commands {
  display: none;
}

.DocSearch-MagnifierLabel {
  margin-right: 10px;
}

.DocSearch-MagnifierLabel svg {
  color: var(--color9) !important;
  stroke: var(--color9) !important;
}

.t_dark .DocSearch {
  --docsearch-container-background: rgba(25, 25, 25, 0.6);
  --docsearch-hit-shadow: none;
  --docsearch-hit-background: #333;
  --docsearch-key-gradient: linear-gradient(-26.5deg, #161618, #4a4a4a);
}

`
