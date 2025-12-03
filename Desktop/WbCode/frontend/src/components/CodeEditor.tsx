import Editor from '@monaco-editor/react';

type CodeEditorProps = {
  language: 'python' | 'c' | 'cpp';
  value: string;
  onChange: (value: string) => void;
};

const CodeEditor = ({ language, value, onChange }: CodeEditorProps) => (
  <div className="h-full">
    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage={language}
      value={value}
      onChange={(v) => onChange(v || '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
        smoothScrolling: true,
        renderWhitespace: 'selection',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true }
      }}
    />
  </div>
);

export default CodeEditor;



