import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizRunner from './QuizRunner';

const mockQuestions = [
  {
    id: 1,
    prompt: 'What is 2+2?',
    options: ['2', '3', '4', '5'],
    explanation: '2+2 equals 4'
  },
  {
    id: 2,
    prompt: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    explanation: 'Paris is the capital'
  }
];

describe('QuizRunner', () => {
  it('should render quiz questions', () => {
    const onSubmit = jest.fn();
    render(<QuizRunner questions={mockQuestions} onSubmit={onSubmit} />);

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });

  it('should allow selecting answers', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<QuizRunner questions={mockQuestions} onSubmit={onSubmit} />);

    const option4 = screen.getByLabelText('4');
    await user.click(option4);

    expect(option4).toBeChecked();
  });

  it('should call onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<QuizRunner questions={mockQuestions} onSubmit={onSubmit} />);

    const option4 = screen.getByLabelText('4');
    await user.click(option4);

    const submitButton = screen.getByText('Submit quiz');
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({ 1: '4' });
  });

  it('should display feedback after submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<QuizRunner questions={mockQuestions} onSubmit={onSubmit} />);

    const submitButton = screen.getByText('Submit quiz');
    await user.click(submitButton);

    expect(screen.getByText(/Feedback saved/i)).toBeInTheDocument();
  });

  it('should handle multiple question answers', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<QuizRunner questions={mockQuestions} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('4'));
    await user.click(screen.getByLabelText('Paris'));

    const submitButton = screen.getByText('Submit quiz');
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      1: '4',
      2: 'Paris'
    });
  });
});










