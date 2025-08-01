import * as monaco from 'monaco-editor';

// Configure Monaco Editor for our dark theme
export const MONACO_THEME = 'replit-dark';

export function initializeMonaco() {
  // Define custom Replit dark theme
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'F0F6FC' },
      { token: 'comment', foreground: '6E7681', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1F6FEB' },
      { token: 'string', foreground: '238636' },
      { token: 'number', foreground: 'FB8500' },
      { token: 'type', foreground: '0969DA' },
      { token: 'class', foreground: '1F6FEB' },
      { token: 'function', foreground: '0969DA' },
      { token: 'variable', foreground: 'F0F6FC' },
      { token: 'constant', foreground: 'FB8500' },
      { token: 'operator', foreground: '8B949E' },
      { token: 'delimiter', foreground: '8B949E' },
      { token: 'tag', foreground: '238636' },
      { token: 'attribute.name', foreground: 'FB8500' },
      { token: 'attribute.value', foreground: '238636' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#F0F6FC',
      'editor.lineHighlightBackground': '#21262D',
      'editor.selectionBackground': '#1F6FEB40',
      'editor.selectionHighlightBackground': '#1F6FEB20',
      'editorCursor.foreground': '#F0F6FC',
      'editorLineNumber.foreground': '#6E7681',
      'editorLineNumber.activeForeground': '#F0F6FC',
      'editor.inactiveSelectionBackground': '#30363D',
      'editorWhitespace.foreground': '#30363D',
      'editorIndentGuide.background': '#21262D',
      'editorIndentGuide.activeBackground': '#30363D',
      'editor.findMatchBackground': '#FB850040',
      'editor.findMatchHighlightBackground': '#FB850020',
      'editorGutter.background': '#0D1117',
      'editorGutter.modifiedBackground': '#FB8500',
      'editorGutter.addedBackground': '#238636',
      'editorGutter.deletedBackground': '#DA3633',
      'scrollbarSlider.background': '#21262D80',
      'scrollbarSlider.hoverBackground': '#30363D80',
      'scrollbarSlider.activeBackground': '#30363D',
    }
  });

  // Configure editor options
  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: MONACO_THEME,
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    fontWeight: '400',
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    renderWhitespace: 'selection',
    renderLineHighlight: 'line',
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: true,
      side: 'right',
      size: 'proportional',
      showSlider: 'mouseover',
      renderCharacters: false,
    },
    bracketPairColorization: {
      enabled: true,
    },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    smoothScrolling: true,
    contextmenu: true,
    mouseWheelScrollSensitivity: 1,
    fastScrollSensitivity: 5,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    wordWrap: 'off',
    wordWrapColumn: 80,
    rulers: [80, 120],
    renderControlCharacters: false,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: true,
    parameterHints: {
      enabled: true,
      cycle: true,
    },
    hover: {
      enabled: true,
      delay: 300,
      sticky: true,
    },
    lightbulb: {
      enabled: true,
    },
    codeActionsOnSave: {
      'source.fixAll': true,
      'source.organizeImports': true,
    },
  };

  return defaultOptions;
}

export function createEditor(
  container: HTMLElement,
  value: string = '',
  language: string = 'plaintext',
  options: Partial<monaco.editor.IStandaloneEditorConstructionOptions> = {}
): monaco.editor.IStandaloneCodeEditor {
  const defaultOptions = initializeMonaco();
  
  const editor = monaco.editor.create(container, {
    ...defaultOptions,
    ...options,
    value,
    language,
  });

  // Configure language-specific features
  configureLanguageFeatures(editor, language);

  return editor;
}

function configureLanguageFeatures(editor: monaco.editor.IStandaloneCodeEditor, language: string) {
  switch (language) {
    case 'python':
      configurePythonFeatures(editor);
      break;
    case 'javascript':
    case 'typescript':
    case 'javascriptreact':
    case 'typescriptreact':
      configureJavaScriptFeatures(editor);
      break;
    case 'html':
      configureHtmlFeatures(editor);
      break;
    case 'css':
    case 'scss':
      configureCssFeatures(editor);
      break;
    case 'json':
      configureJsonFeatures(editor);
      break;
  }
}

function configurePythonFeatures(editor: monaco.editor.IStandaloneCodeEditor) {
  // Add Python-specific configurations
  const model = editor.getModel();
  if (!model) return;

  // Configure indentation for Python
  model.updateOptions({
    tabSize: 4,
    insertSpaces: true,
  });

  // Add Python snippets and completions
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: 'def',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'def ${1:function_name}(${2:args}):\n    ${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function definition',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, args}):\n        ${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if ${1:condition}:\n    ${2:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'try',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Try-except block',
        },
      ];

      return { suggestions };
    },
  });
}

function configureJavaScriptFeatures(editor: monaco.editor.IStandaloneCodeEditor) {
  // Add JavaScript/TypeScript-specific configurations
  const model = editor.getModel();
  if (!model) return;

  // Configure indentation
  model.updateOptions({
    tabSize: 2,
    insertSpaces: true,
  });

  // Add JavaScript snippets
  const language = model.getLanguageId();
  monaco.languages.registerCompletionItemProvider(language, {
    provideCompletionItems: (model, position) => {
      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'function ${1:name}(${2:params}) {\n  ${3:// body}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function declaration',
        },
        {
          label: 'arrow',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '(${1:params}) => {\n  ${2:// body}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Arrow function',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'class ${1:ClassName} {\n  constructor(${2:params}) {\n    ${3:// constructor body}\n  }\n\n  ${4:// methods}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class declaration',
        },
        {
          label: 'useState',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'React useState hook',
        },
        {
          label: 'useEffect',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'useEffect(() => {\n  ${1:// effect body}\n\n  return () => {\n    ${2:// cleanup}\n  };\n}, [${3:dependencies}]);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'React useEffect hook',
        },
      ];

      return { suggestions };
    },
  });
}

function configureHtmlFeatures(editor: monaco.editor.IStandaloneCodeEditor) {
  // HTML-specific configurations
  const model = editor.getModel();
  if (!model) return;

  model.updateOptions({
    tabSize: 2,
    insertSpaces: true,
  });
}

function configureCssFeatures(editor: monaco.editor.IStandaloneCodeEditor) {
  // CSS-specific configurations
  const model = editor.getModel();
  if (!model) return;

  model.updateOptions({
    tabSize: 2,
    insertSpaces: true,
  });
}

function configureJsonFeatures(editor: monaco.editor.IStandaloneCodeEditor) {
  // JSON-specific configurations
  const model = editor.getModel();
  if (!model) return;

  model.updateOptions({
    tabSize: 2,
    insertSpaces: true,
  });

  // Configure JSON validation
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [],
    enableSchemaRequest: true,
  });
}

export function addAiAnnotations(
  editor: monaco.editor.IStandaloneCodeEditor,
  suggestions: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>
) {
  const model = editor.getModel();
  if (!model) return;

  const markers = suggestions.map(suggestion => ({
    startLineNumber: suggestion.line,
    startColumn: suggestion.column,
    endLineNumber: suggestion.line,
    endColumn: suggestion.column + 1,
    message: suggestion.message,
    severity: 
      suggestion.severity === 'error' ? monaco.MarkerSeverity.Error :
      suggestion.severity === 'warning' ? monaco.MarkerSeverity.Warning :
      monaco.MarkerSeverity.Info,
    source: 'AI Assistant',
  }));

  monaco.editor.setModelMarkers(model, 'ai-suggestions', markers);
}

export function clearAiAnnotations(editor: monaco.editor.IStandaloneCodeEditor) {
  const model = editor.getModel();
  if (!model) return;

  monaco.editor.setModelMarkers(model, 'ai-suggestions', []);
}

export function highlightCode(code: string, language: string): string {
  // Use Monaco's tokenizer to highlight code for display outside the editor
  try {
    const tokens = monaco.editor.tokenize(code, language);
    // This would need additional implementation to convert tokens to HTML
    // For now, return plain code
    return code;
  } catch (error) {
    return code;
  }
}

export function disposeEditor(editor: monaco.editor.IStandaloneCodeEditor) {
  const model = editor.getModel();
  if (model) {
    model.dispose();
  }
  editor.dispose();
}

// Auto-save functionality
export function enableAutoSave(
  editor: monaco.editor.IStandaloneCodeEditor,
  onSave: (content: string) => void,
  delay: number = 2000
) {
  let saveTimeout: NodeJS.Timeout;

  const model = editor.getModel();
  if (!model) return () => {};

  const disposable = model.onDidChangeContent(() => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      onSave(model.getValue());
    }, delay);
  });

  return () => {
    clearTimeout(saveTimeout);
    disposable.dispose();
  };
}

// Code formatting
export function formatCode(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
  return editor.getAction('editor.action.formatDocument')?.run() || Promise.resolve();
}

// Find and replace
export function showFindReplace(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.getAction('editor.action.startFindReplaceAction')?.run();
}

// Command palette
export function showCommandPalette(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.trigger('keyboard', 'editor.action.quickCommand', {});
}
