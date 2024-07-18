import React, { useState } from 'react';
import '../styles/ui.css';

function App() {
  const [data, setData] = useState<null | PageLoadState>(null);
  const [selectionLeft, setSelectionLeft] = useState(null);
  const [selectionRight, setSelectionRight] = useState(null);

  React.useEffect(() => {
    // request the initial data.
    parent.postMessage({ pluginMessage: { type: 'page-state' } }, '*');

    // This is how we read messages sent from the plugin controller
    window.onmessage = (event) => {
      const { type, message } = event.data.pluginMessage;
      if (type === 'page-state') {
        setData(message);
      }
    };
  }, []);

  function submit() {
    parent.postMessage(
      {
        pluginMessage: { type: 'replace', from: selectionLeft, to: selectionRight },
      },
      '*'
    );
  }

  if (data === null) {
    return <div>Loading</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-red-200">
      <div className="flex-none" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex h-full">
          <div className="flex-1 h-full bg-blue-200 overflow-y-auto h-full p-2">
            <VariableSelector collections={data} selected={selectionLeft} onSelect={setSelectionLeft} />
          </div>
          <div className="flex-1 h-full bg-blue-200 overflow-y-auto h-full p-2">
            <VariableSelector collections={data} selected={selectionRight} onSelect={setSelectionRight} />
          </div>
        </div>
      </div>
      <div className="bg-green-200 flex-none h-16">
        {selectionLeft !== null && selectionRight !== null ? (
          <button className="p-2" onClick={submit}>
            Replace
          </button>
        ) : (
          <React.Fragment />
        )}
      </div>
    </div>
  );
}

function VariableSelector(props: { collections: PageLoadState; selected?: string; onSelect?: (id: string) => void }) {
  return (
    <React.Fragment>
      {Object.entries(props.collections).map(([id, collection]) => (
        <div key={id}>
          <h1 className="sticky font-bold">{collection.name}</h1>

          <div className="flex flex-col">
            {collection.variables.map((v) => {
              let isActive = v.id === props.selected;
              return isActive ? (
                <button key={v.id} className="text-left m-1 pl-2 bg-red-200">
                  {v.name}
                </button>
              ) : (
                <button
                  className="text-left m-1 pl-2"
                  key={v.id}
                  onClick={() => props.onSelect && props.onSelect(v.id)}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </React.Fragment>
  );
}

export default App;
