import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useImperativeHandle, forwardRef } from "react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SQLEditor = forwardRef<HTMLTextAreaElement, SQLEditorProps>(
  ({ value, onChange }, ref) => {
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      // Calculate cursor position
      const textarea = e.target;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      setCursorPosition({ line, column });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab functionality for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        onChange(newValue);
        
        // Move cursor after the inserted tabs
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    };

    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 relative overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full font-mono text-sm resize-none border-none focus:ring-0 bg-white text-gray-900 leading-relaxed"
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'Consolas, "Courier New", monospace',
              paddingLeft: '56px', // Space for line numbers (48px width + 8px margin)
              paddingTop: '16px',
              paddingRight: '16px',
              paddingBottom: '16px'
            }}
            placeholder="-- Enter your SQL query here
-- Example:
-- SELECT * FROM customers 
-- WHERE created_date >= '2024-01-01'
-- ORDER BY customer_id LIMIT 100;"
          />
          
          {/* Line numbers overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200 px-2 py-4 text-xs text-gray-500 font-mono leading-relaxed select-none pointer-events-none">
            {value.split('\n').map((_, index) => (
              <div key={index} style={{ lineHeight: '1.5' }}>
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Syntax highlighting would be implemented here with a proper library */}
        </div>
        
        {/* Status bar at bottom of editor */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span>|</span>
            <span>SQL</span>
            <span>|</span>
            <span>{value.split('\n').length} lines</span>
            <span>|</span>
            <span>{value.length} characters</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>UTF-8</span>
            <span>|</span>
            <span>CRLF</span>
          </div>
        </div>
      </div>
    );
  }
);

export default SQLEditor;