declare module '*.svg' {
  const content: any;
  export default content;
}

type CollectionId = string;

interface PageLoadState {
  [id: CollectionId]: Collection;
}

interface Collection {
  name: string;
  /// Name of the library this collection belongs to.
  library?: string;
  variables: PVariable[];
}

interface PVariable {
  id: string;
  name: string;
}
