import Flashcard from './Flashcard';

export default {
  title: 'Components/Flashcard',
  component: Flashcard,
  parameters: {
    layout: 'centered',
  },
  args: {
    cards: [
      {
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces with components',
      },
      {
        front: 'What is JSX?',
        back: 'JSX is a syntax extension that allows you to write HTML-like code in JavaScript',
      },
      {
        front: 'What is a Hook?',
        back: 'Hooks are functions that let you "hook into" React features like state and lifecycle',
      },
    ],
  },
};

export const Default = {
  args: {
    cards: [
      {
        front: 'What is React?',
        back: 'A JavaScript library for building user interfaces with components',
      },
      {
        front: 'What is JSX?',
        back: 'JSX is a syntax extension that allows you to write HTML-like code in JavaScript',
      },
      {
        front: 'What is a Hook?',
        back: 'Hooks are functions that let you "hook into" React features like state and lifecycle',
      },
    ],
  },
};

export const StudyCards = {
  args: {
    cards: [
      {
        front: 'Photosynthesis Formula',
        back: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
      },
      {
        front: 'What is Photosynthesis?',
        back: 'The process by which plants convert sunlight into chemical energy stored in glucose',
      },
      {
        front: 'Where does it occur?',
        back: 'In the chloroplasts of plant cells, particularly in the leaves',
      },
      {
        front: 'Importance',
        back: 'Produces oxygen and glucose, essential for plant growth and animal respiration',
      },
    ],
  },
};

export const SingleCard = {
  args: {
    cards: [{ front: 'Definition', back: 'Understanding React Components' }],
  },
};

export const LongText = {
  args: {
    cards: [
      {
        front: 'Explain React Hooks',
        back: 'React Hooks are functions that allow you to use state and other React features in functional components. Common hooks include useState for state management, useEffect for side effects, useContext for context consumption, and useReducer for complex state updates. Hooks must be called at the top level of functional components and not conditionally.',
      },
      {
        front: 'What is Virtual DOM?',
        back: 'The Virtual DOM is a lightweight JavaScript representation of the real DOM. React uses it to improve performance by batching updates and computing the minimal set of changes needed before updating the actual DOM. When state changes, React creates a new Virtual DOM tree, compares it with the previous one (diffing), and updates only the necessary parts of the real DOM (reconciliation).',
      },
    ],
  },
};

export const ManyCards = {
  args: {
    cards: Array.from({ length: 20 }, (_, i) => ({
      front: `Question ${i + 1}`,
      back: `This is the answer to question ${i + 1}. Each card can contain study material and be navigated using arrow keys or buttons.`,
    })),
  },
};
