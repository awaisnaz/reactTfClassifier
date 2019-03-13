import React from 'react';
import ReactDOM from 'react-dom';
import MLApp from './MLApp';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<MLApp />, div);
  ReactDOM.unmountComponentAtNode(div);
});
