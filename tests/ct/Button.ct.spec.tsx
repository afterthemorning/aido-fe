import { expect, test } from '@playwright/experimental-ct-react';
import React from 'react';

interface DemoButtonProps {
  label: string;
  onClick?: () => void;
}

function DemoButton({ label, onClick }: DemoButtonProps) {
  return (
    <button type='button' onClick={onClick} data-testid='demo-button'>
      {label}
    </button>
  );
}

test('renders and handles click', async ({ mount }) => {
  let clicked = false;
  const component = await mount(<DemoButton label='Run' onClick={() => (clicked = true)} />);

  await expect(component.getByTestId('demo-button')).toHaveText('Run');
  await component.getByTestId('demo-button').click();
  expect(clicked).toBeTruthy();
});
