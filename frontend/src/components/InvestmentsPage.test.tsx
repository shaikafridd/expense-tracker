import React from 'react';
import { render, screen } from '@testing-library/react';
import InvestmentsPage from './InvestmentsPage';

jest.mock('./investments/SavingsAnalyzer', () => () => <div data-testid="mock-savings-analyzer">SavingsAnalyzer</div>);
jest.mock('./investments/HealthScore', () => () => <div data-testid="mock-health-score">HealthScore</div>);
jest.mock('./investments/AICards', () => () => <div data-testid="mock-ai-cards">AICards</div>);
jest.mock('./investments/SIPSection', () => () => <div data-testid="mock-sip-section">SIPSection</div>);
jest.mock('./investments/ETFSection', () => () => <div data-testid="mock-etf-section">ETFSection</div>);
jest.mock('./investments/GoalPlanner', () => () => <div data-testid="mock-goal-planner">GoalPlanner</div>);
jest.mock('./investments/LearnCards', () => () => <div data-testid="mock-learn-cards">LearnCards</div>);

describe('InvestmentsPage Component', () => {
  it('renders all nested sections and widgets successfully', () => {
    render(<InvestmentsPage budget={1000} spent={400} />);

    expect(screen.getByTestId('mock-savings-analyzer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-health-score')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ai-cards')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sip-section')).toBeInTheDocument();
    expect(screen.getByTestId('mock-etf-section')).toBeInTheDocument();
    expect(screen.getByTestId('mock-goal-planner')).toBeInTheDocument();
    expect(screen.getByTestId('mock-learn-cards')).toBeInTheDocument();
  });
});
