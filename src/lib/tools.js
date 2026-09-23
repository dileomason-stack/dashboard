// Academic tools the Tool widget can show. Each one was checked to load
// inside a card (many sites, like Wolfram Alpha or Symbolab, refuse to).
export const TOOLS = {
  graphing: { name: 'Desmos graphing calculator', url: 'https://www.desmos.com/calculator', address: 'desmos.com' },
  scientific: { name: 'Desmos scientific calculator', url: 'https://www.desmos.com/scientific', address: 'desmos.com' },
  matrix: { name: 'Desmos matrix calculator', url: 'https://www.desmos.com/matrix', address: 'desmos.com' },
  geometry: { name: 'Desmos geometry', url: 'https://www.desmos.com/geometry', address: 'desmos.com' },
  geogebra: { name: 'GeoGebra calculator', url: 'https://www.geogebra.org/calculator', address: 'geogebra.org' },
  periodic: { name: 'Periodic table', url: 'https://ptable.com', address: 'ptable.com' },
  whiteboard: { name: 'Whiteboard (Excalidraw)', url: 'https://excalidraw.com', address: 'excalidraw.com' },
  pythontutor: { name: 'Python Tutor (step through code)', url: 'https://pythontutor.com/visualize.html', address: 'pythontutor.com' },
  timer: { name: 'Focus timer (Pomofocus)', url: 'https://pomofocus.io', address: 'pomofocus.io' },
}

// Games the Game widget can show; each was checked to play inside a card.
// (Wordle, Immaculate Grid, Poeltl and others refuse, so they're in the Fun
// template's Links card instead.)
export const GAMES = {
  hoopgrids: { name: 'HoopGrids (NBA grid)', url: 'https://www.hoopgrids.com', address: 'hoopgrids.com' },
  globle: { name: 'Globle (guess the country)', url: 'https://globle-game.com', address: 'globle-game.com' },
  semantle: { name: 'Semantle (word meaning)', url: 'https://www.semantle.com', address: 'semantle.com' },
  costcodle: { name: 'Costcodle (guess the price)', url: 'https://costcodle.com', address: 'costcodle.com' },
  framed: { name: 'Framed (guess the movie)', url: 'https://framed.wtf', address: 'framed.wtf' },
  chesspuzzle: { name: 'Chess puzzle of the day', url: 'https://lichess.org/training/frame', address: 'lichess.org' },
  chesstv: { name: 'Live chess (Lichess TV)', url: 'https://lichess.org/tv/frame', address: 'lichess.org' },
  coolmath: { name: 'Coolmath Games', url: 'https://www.coolmathgames.com', address: 'coolmathgames.com' },
  g2048: { name: '2048', url: 'https://www.2048.org', address: '2048.org' },
  solitaire: { name: 'Solitaire', url: 'https://www.solitr.com', address: 'solitr.com' },
  dino: { name: 'Chrome Dino runner', url: 'https://chromedino.com', address: 'chromedino.com' },
  sporcle: { name: 'Sporcle quizzes', url: 'https://www.sporcle.com', address: 'sporcle.com' },
  minesweeper: { name: 'Minesweeper', url: 'https://minesweeper.online', address: 'minesweeper.online' },
}
