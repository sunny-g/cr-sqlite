# @vlcn.io/direct-connect-browser

## 0.1.0

### Minor Changes

- automigrate fixes for WASM, react fixes for referential equality, direct-connect networking implementations, sync in shared worker, dbProvider hooks for React

### Patch Changes

- 5aecbb6: re-introduce passing of worker and wasm urls
- c81b7d5: optional wasm and worker uris
- 2d17a8e: filter bug
- 4e737a0: better error reporting on migration failure, handle schema swap
- 62934ad: thread wasm uri down to worker
- Updated dependencies
- Updated dependencies [4e737a0]
  - @vlcn.io/crsqlite-wasm@0.11.0
  - @vlcn.io/direct-connect-common@0.2.0
  - @vlcn.io/rx-tbl@0.10.0
  - @vlcn.io/xplat-api@0.10.0

## 0.0.7-next.5

### Patch Changes

- filter bug

## 0.0.7-next.4

### Patch Changes

- thread wasm uri down to worker

## 0.0.7-next.3

### Patch Changes

- optional wasm and worker uris

## 0.0.7-next.2

### Patch Changes

- re-introduce passing of worker and wasm urls

## 0.0.7-next.0

### Patch Changes

- better error reporting on migration failure, handle schema swap
- Updated dependencies
  - @vlcn.io/crsqlite-wasm@0.10.2-next.0

## 0.0.6

### Patch Changes

- remove some cosonle.logs, add utility state hooks

## 0.0.5

### Patch Changes

- restart connect on version mismatch

## 0.0.4

### Patch Changes

- vite workaround so worker works in both prod and dev mode

## 0.0.3

### Patch Changes

- include the worker in such a way that vite understands

## 0.0.2

### Patch Changes

- fts5, sqlite 3.42.1, direct-connect packages
- Updated dependencies [6dbfdcb]
- Updated dependencies
  - @vlcn.io/crsqlite-wasm@0.10.1
  - @vlcn.io/direct-connect-common@0.1.1
  - @vlcn.io/rx-tbl@0.9.1
  - @vlcn.io/xplat-api@0.9.1