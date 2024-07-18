declare module '*.svg' {
  const content: any;
  export default content;
}

type CollectionId = string;

interface PageLoadState {
  [id: CollectionId]: Collection
}

interface Collection {
  name: String,
  variables: PVariable[]
}

interface PVariable {
  id: string,
  name: string,
}