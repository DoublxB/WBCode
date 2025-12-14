import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

type CodeEditorProps = {
  language: 'python' | 'c' | 'cpp';
  value: string;
  onChange: (value: string) => void;
  onTypingMetrics?: (metrics: { 
    charsPerSecond: number; 
    totalChars: number; 
    timeSpent: number;
    hasLargePaste?: boolean;
    largestPasteSize?: number;
  }) => void;
};

const CodeEditor = ({ language, value, onChange, onTypingMetrics }: CodeEditorProps) => {
  const startTimeRef = useRef<number | null>(null);
  const charCountRef = useRef<number>(0);
  const lastValueLengthRef = useRef<number>(0);
  const lastChangeTimeRef = useRef<number | null>(null);
  const largestPasteRef = useRef<number>(0);
  const hasLargePasteRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset tracking când se schimbă exercițiul (value se resetează la starterCode)
    if (value.length === 0) {
      startTimeRef.current = null;
      charCountRef.current = 0;
      lastValueLengthRef.current = 0;
      lastChangeTimeRef.current = null;
      largestPasteRef.current = 0;
      hasLargePasteRef.current = false;
    }
  }, [value]);

  const handleChange = (newValue: string | undefined) => {
    const currentValue = newValue || '';
    const currentTime = Date.now();

    // Dacă este prima modificare, inițializăm timer-ul
    if (startTimeRef.current === null) {
      startTimeRef.current = currentTime;
      lastValueLengthRef.current = currentValue.length;
      lastChangeTimeRef.current = currentTime;
      onChange(currentValue);
      return;
    }

    // Calculăm caracterele adăugate (nu șterse)
    const previousLength = lastValueLengthRef.current;
    const currentLength = currentValue.length;
    
    // Detectare paste: dacă s-au adăugat multe caractere într-un timp foarte scurt
    const timeSinceLastChange = lastChangeTimeRef.current 
      ? (currentTime - lastChangeTimeRef.current) / 1000 
      : 0;
    const charsAdded = currentLength - previousLength;
    
    // Dacă s-au adăugat mai mult de 50 caractere în mai puțin de 0.5 secunde, e paste mare
    // Am mărit pragul de timp pentru a detecta mai bine paste-urile
    if (charsAdded > 50 && timeSinceLastChange < 0.5) {
      // Considerăm că toate caracterele au fost adăugate instant (paste mare)
      charCountRef.current += charsAdded;
      hasLargePasteRef.current = true;
      if (charsAdded > largestPasteRef.current) {
        largestPasteRef.current = charsAdded;
      }
      
      // Setăm timpul de start la acum pentru a calcula rata corect
      // Dacă e paste mare, considerăm că a durat foarte puțin (10ms)
      const timeForPaste = 0.01; // 10ms pentru paste
      const totalTime = (currentTime - startTimeRef.current) / 1000 + timeForPaste;
      
      console.log('🔴 Large paste detected!', {
        charsAdded,
        timeSinceLastChange,
        totalChars: charCountRef.current,
        largestPasteSize: largestPasteRef.current
      });
      
      if (onTypingMetrics) {
        onTypingMetrics({
          charsPerSecond: 999, // Forțează rata foarte mare pentru paste-uri mari
          totalChars: charCountRef.current,
          timeSpent: totalTime,
          hasLargePaste: true,
          largestPasteSize: largestPasteRef.current
        });
      }
    } else if (charsAdded > 10 && timeSinceLastChange < 0.2) {
      // Paste mic (10-50 caractere)
      charCountRef.current += charsAdded;
      const timeForPaste = 0.01;
      const totalTime = (currentTime - startTimeRef.current) / 1000 + timeForPaste;
      const charsPerSecond = totalTime > 0 ? charCountRef.current / totalTime : 0;
      
      console.log('🟡 Small paste detected!', {
        charsAdded,
        timeSinceLastChange,
        charsPerSecond,
        totalChars: charCountRef.current
      });
      
      if (onTypingMetrics) {
        onTypingMetrics({
          charsPerSecond,
          totalChars: charCountRef.current,
          timeSpent: totalTime,
          hasLargePaste: false,
          largestPasteSize: charsAdded
        });
      }
    } else if (currentLength > previousLength) {
      // Caractere noi adăugate normal (scriere manuală)
      charCountRef.current += charsAdded;
      
      // Calculăm metricile
      const timeSpent = (currentTime - startTimeRef.current) / 1000;
      const charsPerSecond = timeSpent > 0 ? charCountRef.current / timeSpent : 0;

      // Notificăm componenta părinte despre metrici
      // Folosim valorile din ref-uri pentru paste-uri (pot fi setate de event listener)
      if (onTypingMetrics) {
        onTypingMetrics({
          charsPerSecond,
          totalChars: charCountRef.current,
          timeSpent,
          hasLargePaste: hasLargePasteRef.current,
          largestPasteSize: largestPasteRef.current
        });
      }
    }

    lastValueLengthRef.current = currentLength;
    lastChangeTimeRef.current = currentTime;
    onChange(currentValue);
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage={language}
        value={value}
        onChange={handleChange}
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
          formatOnPaste: false, // Dezactivăm formatarea la paste pentru a detecta mai bine copierea
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
};

export default CodeEditor;



