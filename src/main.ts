import { TEXT } from './game/config/text';
import { NightMarketGame } from './game/NightMarketGame';
import './style.css';

void NightMarketGame.launch().catch((error: unknown) => {
  console.error(error);
  document.body.textContent = TEXT.launchError;
});
