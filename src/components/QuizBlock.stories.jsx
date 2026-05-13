import QuizBlock from './QuizBlock';

export default {
  title: 'Components/QuizBlock',
  component: QuizBlock,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    questions: [
      {
        id: '1',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct: 'Paris',
        explanation:
          'Paris is the capital and largest city of France, located in the north-central part of the country.',
      },
      {
        id: '2',
        question: 'What is the largest planet in our solar system?',
        options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
        correct: 'Jupiter',
        explanation:
          'Jupiter is the largest planet in our solar system with a mass more than twice that of all other planets combined.',
      },
      {
        id: '3',
        question: 'Who wrote "Romeo and Juliet"?',
        options: ['Jane Austen', 'Mark Twain', 'William Shakespeare', 'Charles Dickens'],
        correct: 'William Shakespeare',
        explanation:
          'William Shakespeare wrote "Romeo and Juliet" early in his career, probably between 1594 and 1596.',
      },
    ],
  },
};

export const Programming = {
  args: {
    questions: [
      {
        id: 'prog-1',
        question: 'What does "const" declare in JavaScript?',
        options: [
          'A variable that can be reassigned',
          'A variable that cannot be reassigned',
          'A global variable',
          'A variable with function scope',
        ],
        correct: 'A variable that cannot be reassigned',
        explanation:
          'The "const" keyword declares a block-scoped variable that cannot be reassigned. However, the properties of objects or elements of arrays can still be modified.',
      },
      {
        id: 'prog-2',
        question: 'What is the difference between async/await and Promises?',
        options: [
          'They are exactly the same',
          'async/await is syntactic sugar over Promises',
          'Promises are faster than async/await',
          'async/await only works with older JavaScript',
        ],
        correct: 'async/await is syntactic sugar over Promises',
        explanation:
          'async/await is syntactic sugar built on top of Promises, making asynchronous code look and behave more like synchronous code.',
      },
      {
        id: 'prog-3',
        question: 'What output does this code produce? let x = 5; console.log(x++, ++x);',
        options: ['5 7', '6 7', '5 6', '6 6'],
        correct: '5 7',
        explanation:
          'x++ returns 5 (post-increment), then x becomes 6. ++x increments first making x = 7, then returns 7. So output is "5 7".',
      },
    ],
  },
};

export const SingleQuestion = {
  args: {
    questions: [
      {
        id: 'single-1',
        question: 'What is the primary function of HTML?',
        options: [
          'To style web pages',
          'To structure and display content on the web',
          'To add interactivity to web pages',
          'To store data on servers',
        ],
        correct: 'To structure and display content on the web',
        explanation:
          'HTML (HyperText Markup Language) is used to structure and display content on the web by using tags and elements.',
      },
    ],
  },
};

export const ManyQuestions = {
  args: {
    questions: Array.from({ length: 10 }, (_, i) => ({
      id: `q-${i}`,
      question: `Question ${i + 1}: What is the answer?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 'Option B',
      explanation: `This is the explanation for question ${i + 1}. In a real quiz, this would provide detailed feedback about why the correct answer is right.`,
    })),
  },
};

export const ComplexOptions = {
  args: {
    questions: [
      {
        id: 'complex-1',
        question: 'Which of these statements about React is correct?',
        options: [
          'React uses two-way data binding to update components',
          'React uses unidirectional data flow from parent to child components',
          'React components always re-render when props change',
          'React Hooks can be called conditionally inside render methods',
        ],
        correct: 'React uses unidirectional data flow from parent to child components',
        explanation:
          'React implements unidirectional data flow, where data flows from parent components down to child components through props. This makes the application more predictable.',
      },
      {
        id: 'complex-2',
        question: 'What is the correct way to handle form input in React?',
        options: [
          'Use refs to access DOM elements directly',
          'Store form values in local component state',
          'Modify the DOM directly with document.querySelector',
          'Use two-way binding like in Vue',
        ],
        correct: 'Store form values in local component state',
        explanation:
          'In React, the recommended approach is to store form values in component state and update them through onChange handlers. This follows the controlled component pattern.',
      },
    ],
  },
};
