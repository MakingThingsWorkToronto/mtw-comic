import { render } from 'preact';
import './theme/fonts.css';
import './theme/tokens.css';
import './theme/app.css';
import './ui/ui.css';
import { App } from './shell/App';
import { connectEvents } from './state';

connectEvents();
render(<App />, document.getElementById('app') as HTMLElement);
