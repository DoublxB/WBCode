import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeEditor from './CodeEditor';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return function MockEditor({ value, onChange, language }: any) {
    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${language} editor`}
        />
      </div>
    );
  };
});

describe('CodeEditor', () => {
  it('should render code editor', () => {
    const onChange = jest.fn();
    render(<CodeEditor language="python" value="print('hello')" onChange={onChange} />);

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should call onChange when code changes', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CodeEditor language="python" value="" onChange={onChange} />);

    const textarea = screen.getByTestId('editor-textarea');
    await user.type(textarea, 'print("test")');

    expect(onChange).toHaveBeenCalled();
  });

  it('should display initial value', () => {
    const onChange = jest.fn();
    render(<CodeEditor language="python" value="print('hello')" onChange={onChange} />);

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveValue("print('hello')");
  });

  it('should support different languages', () => {
    const onChange = jest.fn();
    const { rerender } = render(<CodeEditor language="python" value="" onChange={onChange} />);

    expect(screen.getByPlaceholderText('python editor')).toBeInTheDocument();

    rerender(<CodeEditor language="c" value="" onChange={onChange} />);
    expect(screen.getByPlaceholderText('c editor')).toBeInTheDocument();
  });
});

















