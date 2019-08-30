import React from 'react';
import ReactDOM from 'react-dom';
import Mlapp from './mlapp';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Mlapp />, div);
  ReactDOM.unmountComponentAtNode(div);
});
