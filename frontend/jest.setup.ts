import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTML Canvas getContext
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  rect: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 0 }),
});

// Mock lucide-react dynamically using Proxy and React.createElement
jest.mock('lucide-react', () => {
  return new Proxy({}, {
    get: (target, name) => {
      return (props: any) => {
        const React = require('react');
        return React.createElement('span', {
          ...props,
          'data-testid': `icon-${String(name).toLowerCase()}`
        }, String(name));
      };
    }
  });
});

// Mock react-chartjs-2 using React.createElement to avoid canvas issues
jest.mock('react-chartjs-2', () => {
  const React = require('react');
  return {
    Doughnut: (props: any) => {
      return React.createElement('div', {
        ...props,
        'data-testid': 'mock-doughnut-chart'
      }, 'Mock Doughnut Chart');
    },
    Bar: (props: any) => {
      return React.createElement('div', {
        ...props,
        'data-testid': 'mock-bar-chart'
      }, 'Mock Bar Chart');
    },
    Line: (props: any) => {
      return React.createElement('div', {
        ...props,
        'data-testid': 'mock-line-chart'
      }, 'Mock Line Chart');
    },
    Pie: (props: any) => {
      return React.createElement('div', {
        ...props,
        'data-testid': 'mock-pie-chart'
      }, 'Mock Pie Chart');
    },
  };
});
